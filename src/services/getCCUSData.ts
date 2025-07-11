import pool from '@/lib/db';
import { CCUSItem, GeoJSONFeatureCollection } from '@/lib/types2';

export async function getCCUSData(): Promise<GeoJSONFeatureCollection> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        id,
        internal_id,
        data->>'plant_name' AS name,
        data->>'city' AS city,
        data->>'country' AS country,
        data->>'region' AS region,
        data->>'street' AS street,
        data->>'email' AS email,
        data->>'owner' AS owner,
        data->>'contact' AS contact,
        data->>'website' AS website,
        data->>'product' AS product,
        data->>'zip_code' AS zip_code,
        data->>'project_id' AS project_id,
        data->>'data_source' AS data_source,
        data->>'last_updated' AS last_updated,
        data->>'project_name' AS project_name,
        data->>'project_type' AS project_type,
        data->>'stakeholders' AS stakeholders,
        data->>'end_use_sector' AS end_use_sector,
        data->>'technology_fate' AS technology_fate,
        data->>'investment_capex' AS investment_capex,
        data->>'part_of_ccus_hub' AS part_of_ccus_hub,
        data->'status_date'->>'fid_date' AS fid_date,
        data->'status_date'->>'project_phase' AS project_phase,
        data->'status_date'->>'operation_date' AS operation_date,
        CASE 
          WHEN data->'status_date'->>'operation_date' ~ '^[0-9]+$' 
          THEN (data->'status_date'->>'operation_date')::integer
          ELSE NULL
        END AS start_year,
        data->'status_date'->>'project_status' AS project_status,
        data->'status_date'->>'project_status' AS status,
        data->'status_date'->>'suspension_date' AS suspension_date,
        data->'status_date'->>'announcement_date' AS announcement_date,
        data->'capacity'->>'unit' AS capacity_unit,
        data->'capacity'->'announced'->>'unit' AS capacity_announced_unit,
        CASE 
          WHEN data->'capacity'->'announced'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacity'->'announced'->>'value')::double precision
          ELSE NULL
        END AS capacity_announced_value,
        data->'capacity'->'estimated'->>'unit' AS capacity_estimated_unit,
        CASE 
          WHEN data->'capacity'->'estimated'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacity'->'estimated'->>'value')::double precision
          ELSE NULL
        END AS capacity_estimated_value,
        COALESCE((
          SELECT array_agg(
            jsonb_build_object(
              'ref', refs->>'ref',
              'link', refs->>'link'
            )
          )
          FROM jsonb_array_elements(
            jsonb_build_array(
              jsonb_build_object('ref', data->'references'->>'ref1', 'link', data->'references'->>'link1'),
              jsonb_build_object('ref', data->'references'->>'ref2', 'link', data->'references'->>'link2'),
              jsonb_build_object('ref', data->'references'->>'ref3', 'link', data->'references'->>'link3'),
              jsonb_build_object('ref', data->'references'->>'ref4', 'link', data->'references'->>'link4'),
              jsonb_build_object('ref', data->'references'->>'ref5', 'link', data->'references'->>'link5'),
              jsonb_build_object('ref', data->'references'->>'ref6', 'link', data->'references'->>'link6'),
              jsonb_build_object('ref', data->'references'->>'ref7', 'link', data->'references'->>'link7')
            )
          ) AS refs
          WHERE refs->>'ref' IS NOT NULL OR refs->>'link' IS NOT NULL
        ), '{}') AS references,
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
        sector AS type
      FROM project_map
      WHERE sector = 'CCUS'
    `);

    const formatFeature = (item: CCUSItem): GeoJSONFeatureCollection['features'][0] => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude ?? 0, item.latitude ?? 0],
      },
      properties: {
        id: item.id,
        internal_id: item.internal_id,
        name: item.name ?? 'Unknown Feature',
        city: item.city ?? '',
        country: item.country ?? '',
        region: item.region ?? '',
        street: item.street ?? '',
        email: item.email ?? '',
        owner: item.owner ?? '',
        contact: item.contact ?? '',
        website: item.website ?? '',
        product: item.product ?? '',
        zip_code: item.zip_code ?? '',
        project_id: item.project_id ?? '',
        data_source: item.data_source ?? '',
        last_updated: item.last_updated ?? '',
        project_name: item.project_name ?? '',
        project_type: item.project_type ?? '',
        stakeholders: item.stakeholders ?? '',
        end_use_sector: item.end_use_sector ?? '',
        technology_fate: item.technology_fate ?? '',
        investment_capex: item.investment_capex ?? '',
        part_of_ccus_hub: item.part_of_ccus_hub ?? '',
        fid_date: item.fid_date ?? '',
        project_phase: item.project_phase ?? '',
        operation_date: item.operation_date ?? '',
        project_status: item.project_status ?? '',
        status: item.status ?? '',
        start_year: item.start_year,
        suspension_date: item.suspension_date ?? '',
        announcement_date: item.announcement_date ?? '',
        capacity_unit: item.capacity_unit ?? '',
        capacity_announced_unit: item.capacity_announced_unit ?? '',
        capacity_announced_value: item.capacity_announced_value,
        capacity_estimated_unit: item.capacity_estimated_unit ?? '',
        capacity_estimated_value: item.capacity_estimated_value,
        references: Array.isArray(item.references) ? item.references : [],
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type,
      } as CCUSItem,
    });

    const toGeoJSON = (rows: CCUSItem[]): GeoJSONFeatureCollection => ({
      type: 'FeatureCollection',
      features: rows
        .filter((r: CCUSItem) => r.latitude !== null && r.longitude !== null)
        .map((r: CCUSItem) => formatFeature(r)),
    });

    const rows: CCUSItem[] = result.rows;
    console.log(`[INFO] Missing coordinates - CCUS: ${rows.filter((r: CCUSItem) => r.latitude === null || r.longitude === null).length}`);

    return toGeoJSON(rows);
  } catch (err: unknown) {
    console.error('[getCCUSData ERROR]', err);
    throw new Error('Failed to load CCUS data');
  } finally {
    client.release();
  }
}