// /src/services/getPlantFeature.ts
import pool from '@/lib/db';
import { Feature } from '@/app/components/LeafletMap';

interface PlantFeatureResult {
  feature: Feature | null;
  error: string | null;
}

export async function getPlantFeature(id: string, type: string): Promise<PlantFeatureResult> {
  const client = await pool.connect();
  try {
    if (!id) {
      return { feature: null, error: 'Invalid ID' };
    }

    const allowedTypes = ['hydrogen', 'ccus', 'production', 'storage'];
    if (!allowedTypes.includes(type.toLowerCase())) {
      return { feature: null, error: `Invalid feature type: ${type}` };
    }

    const query = `
      SELECT 
        id,
        internal_id,
        file_link,
        tab,
        line,
        created_at,
        sector,
        data->>'plant_name' AS name,
        data->>'city' AS city,
        data->>'country' AS country,

        CASE
          WHEN sector = 'CCUS' AND data->'status_date'->>'operation_date' ~ '^[0-9]+$'
          THEN (data->'status_date'->>'operation_date')::int
          WHEN data->'status'->>'date_online' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'status'->>'date_online')::float::int
          ELSE NULL
        END AS start_year,

        CASE 
          WHEN sector = 'Production' AND data->'capacity'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacity'->>'value')::double precision
          WHEN sector = 'Storage' AND data->'capacities'->'injection'->'power_mw'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'injection'->'power_mw'->>'value')::double precision
          WHEN sector = 'CCUS' AND data->'capacity'->'estimated'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (data->'capacity'->'estimated'->>'value')::double precision
          ELSE NULL
        END AS capacity_mw,

        CASE 
          WHEN sector = 'CCUS' THEN data->>'technology_fate'
          ELSE data->>'technology'
        END AS process,

        CASE
          WHEN sector = 'CCUS' THEN data->>'end_use_sector'
          ELSE
            CASE 
              WHEN jsonb_typeof(data->'end_use') = 'array' THEN
                array_to_string(
                  ARRAY(
                    SELECT jsonb_array_elements_text(data->'end_use')
                  ), ', '
                )
              ELSE data->>'end_use'
            END
        END AS end_use,

        CASE 
          WHEN data->>'consumption' ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (data->>'consumption')::double precision
          ELSE NULL
        END AS consumption_tpy,

        CASE 
          WHEN data->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'coordinates'->>'latitude')::double precision
          WHEN data->'status'->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'status'->'coordinates'->>'latitude')::double precision
          WHEN data->'status_date'->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'status_date'->'coordinates'->>'latitude')::double precision
          ELSE NULL
        END AS latitude,

        CASE 
          WHEN data->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'coordinates'->>'longitude')::double precision
          WHEN data->'status'->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'status'->'coordinates'->>'longitude')::double precision
          WHEN data->'status_date'->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'status_date'->'coordinates'->>'longitude')::double precision
          ELSE NULL
        END AS longitude,

        CASE 
          WHEN sector = 'CCUS' THEN data->'status_date'->>'project_status'
          ELSE data->'status'->>'current_status'
        END AS status

      FROM project_map
      WHERE internal_id = $1 AND sector IN ('Production', 'Storage', 'CCUS')
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return { feature: null, error: 'Feature not found' };
    }

    const item = result.rows[0];
    const feature: Feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude ?? 0, item.latitude ?? 0],
      },
      properties: {
        id: item.id,
        internal_id: item.internal_id,
        name: item.name ?? 'Unknown Feature',
        type: item.sector,
        status: String(item.status ?? ''),
        start_year: item.start_year ?? 0,
        capacity_mw: item.capacity_mw ?? 0,
        process: String(item.process ?? ''),
        end_use: String(item.end_use ?? ''),
        consumption_tpy: item.consumption_tpy ?? 0,
        city: String(item.city ?? ''),
        country: String(item.country ?? ''),
      },
    };

    return { feature, error: null };
  } catch (error) {
    console.error('[getPlantFeature ERROR]', error);
    return { feature: null, error: 'Internal server error' };
  } finally {
    client.release();
  }
}
