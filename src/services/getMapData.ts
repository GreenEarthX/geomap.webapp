import pool from '@/lib/db';

export async function getMapData() {
  const client = await pool.connect();

  try {
    const hydrogen = await client.query(`
      SELECT 
        id,
        internal_id,
        data->>'plant_name' AS name,
        data->>'city' AS city,
        data->>'country' AS country,

        -- Safe parsing of start_year
        CASE
          WHEN data->'status'->>'date_online' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'status'->>'date_online')::float::int
          ELSE NULL
        END AS start_year,

        -- Safe parsing of capacity_mw based on sector
        CASE 
          WHEN sector = 'Production' AND data->'capacity'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacity'->>'value')::double precision
          WHEN sector = 'Storage' AND data->'capacities'->'injection'->'power_mw'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'injection'->'power_mw'->>'value')::double precision
          ELSE NULL
        END AS capacity_mw,

        data->>'technology' AS process,
        data->'end_use' AS end_use,

        -- Safe parsing of consumption_tpy
        CASE 
          WHEN data->>'consumption' ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (data->>'consumption')::double precision
          ELSE NULL
        END AS consumption_tpy,

        -- Safe parsing of latitude
        CASE 
          WHEN data->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'coordinates'->>'latitude')::double precision
          WHEN data->'status'->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'status'->'coordinates'->>'latitude')::double precision
          ELSE NULL
        END AS latitude,

        -- Safe parsing of longitude
        CASE 
          WHEN data->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'coordinates'->>'longitude')::double precision
          WHEN data->'status'->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'status'->'coordinates'->>'longitude')::double precision
          ELSE NULL
        END AS longitude,

        data->'status'->>'current_status' AS status,
        data->>'secondary_product' AS secondary_product,
        sector AS type

      FROM project_map
      WHERE sector IN ('Production', 'Storage')
    `);

    const formatFeature = (item: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude ?? 0, item.latitude ?? 0],
      },
      properties: {
        id: item.id,
        internal_id: item.internal_id,
        name: item.name ?? 'Unknown Feature',
        type: item.type, // ✅ Use the sector value: 'Production' or 'Storage'
        status: String(item.status ?? ''),
        start_year: item.start_year ?? null,
        capacity_mw: item.capacity_mw ?? null,
        process: String(item.process ?? ''),
        end_use: Array.isArray(item.end_use) ? item.end_use.join(', ') : String(item.end_use ?? ''),
        consumption_tpy: item.consumption_tpy ?? null,
        city: String(item.city ?? ''),
        country: String(item.country ?? ''),
        secondary_product: String(item.secondary_product ?? ''),
      },
    });

    const toGeoJSON = (rows: any[]) => {
      const missingProduction = rows.filter(r => (r.latitude === null || r.longitude === null) && r.type === 'Production');
      const missingStorage = rows.filter(r => (r.latitude === null || r.longitude === null) && r.type === 'Storage');

      console.log(`[INFO] Missing coordinates - Production: ${missingProduction.length}`);
      console.log(`[INFO] Missing coordinates - Storage: ${missingStorage.length}`);

      return {
        type: 'FeatureCollection',
        features: rows
          .filter(r => r.latitude !== null && r.longitude !== null)
          .map(r => formatFeature(r)),
      };
    };

    return {
      hydrogen: toGeoJSON(hydrogen.rows),
    };
  } catch (err) {
    console.error('[getMapData ERROR]', err);
    throw new Error('Failed to load data');
  } finally {
    client.release();
  }
}
