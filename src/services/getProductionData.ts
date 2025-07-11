import pool from '@/lib/db';
import { ProductionItem, GeoJSONFeatureCollection } from '@/lib/types2';

export async function getProductionData(): Promise<GeoJSONFeatureCollection> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        id,
        internal_id,
        data->>'plant_name' AS name,
        data->>'city' AS city,
        data->>'country' AS country,
        data->>'zip' AS zip,
        data->>'email' AS email,
        data->>'owner' AS owner,
        data->>'ref_id' AS ref_id,
        data->'status'->>'date_online' AS date_online,
        data->'status'->>'current_status' AS current_status,
        data->'status'->>'current_status' AS status,
        CASE 
          WHEN data->'status'->>'date_online' ~ '^[0-9]+$' 
          THEN (data->'status'->>'date_online')::integer
          ELSE NULL
        END AS start_year,
        data->'status'->>'completion_date' AS completion_date,
        data->>'street' AS street,
        data->>'website_url' AS website_url,
        data->>'contact_name' AS contact_name,
        data->>'project_name' AS project_name,
        data->>'project_type' AS project_type,
        data->>'primary_product' AS primary_product,
        data->>'secondary_product' AS secondary_product,
        data->>'references' AS references,
        data->>'technology' AS technology,
        data->'capacity'->>'unit' AS capacity_unit,
        CASE 
          WHEN data->'capacity'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacity'->>'value')::double precision
          ELSE NULL
        END AS capacity_value,
        data->'end_use' AS end_use,
        data->'stakeholders' AS stakeholders,
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
      WHERE sector = 'Production'
    `);

    const formatFeature = (item: ProductionItem): GeoJSONFeatureCollection['features'][0] => ({
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
        zip: item.zip ?? '',
        email: item.email ?? '',
        owner: item.owner ?? '',
        ref_id: item.ref_id ?? '',
        date_online: item.date_online ?? '',
        current_status: item.current_status ?? '',
        status: item.status ?? '',
        start_year: item.start_year,
        completion_date: item.completion_date ?? '',
        street: item.street ?? '',
        website_url: item.website_url ?? '',
        contact_name: item.contact_name ?? '',
        project_name: item.project_name ?? '',
        project_type: item.project_type ?? '',
        primary_product: item.primary_product ?? '',
        secondary_product: item.secondary_product ?? '',
        references: item.references ?? '',
        technology: item.technology ?? '',
        capacity_unit: item.capacity_unit ?? '',
        capacity_value: item.capacity_value,
        end_use: Array.isArray(item.end_use) ? item.end_use : [],
        stakeholders: Array.isArray(item.stakeholders) ? item.stakeholders : [],
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type,
      } as ProductionItem,
    });

    const toGeoJSON = (rows: ProductionItem[]): GeoJSONFeatureCollection => ({
      type: 'FeatureCollection',
      features: rows
        .filter((r: ProductionItem) => r.latitude !== null && r.longitude !== null)
        .map((r: ProductionItem) => formatFeature(r)),
    });

    const rows: ProductionItem[] = result.rows;
    console.log(`[INFO] Missing coordinates - Production: ${rows.filter((r: ProductionItem) => r.latitude === null || r.longitude === null).length}`);

    return toGeoJSON(rows);
  } catch (err: unknown) {
    console.error('[getProductionData ERROR]', err);
    throw new Error('Failed to load Production data');
  } finally {
    client.release();
  }
}
