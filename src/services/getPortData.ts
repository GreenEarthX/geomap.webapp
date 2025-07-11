import pool from '@/lib/db';
import { GeoJSONFeatureCollection, PortItem } from '@/lib/types2';

export async function getPortData(): Promise<GeoJSONFeatureCollection> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        id,
        internal_id,
        data->>'ref' AS ref_id,
        data->>'project_name' AS project_name,
        data->>'location' AS city,
        data->>'country' AS country,
        data->>'trade_type' AS trade_type,
        data->>'partners' AS partners,
        data->'investment' AS investment,
        data->'status_dates' AS status_dates,
        data->>'product_type' AS product_type,
        data->>'data_source' AS data_source,
        data->>'technology_type' AS technology_type,
        data->'capacity'->'announced_size' AS announced_size,
        data->'references' AS references,
        CASE 
          WHEN data->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'coordinates'->>'latitude')::double precision
          ELSE NULL
        END AS latitude,
        CASE 
          WHEN data->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
          THEN (data->'coordinates'->>'longitude')::double precision
          ELSE NULL
        END AS longitude,
        sector AS type
      FROM project_map
      WHERE sector = 'Port'
    `);

    const formatFeature = (item: PortItem): GeoJSONFeatureCollection['features'][0] => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude ?? 0, item.latitude ?? 0],
      },
      properties: {
        id: item.id,
        internal_id: item.internal_id ?? null,
        ref_id: item.ref_id ?? null,
        name: item.project_name ?? null,
        city: item.city ?? null,
        country: item.country ?? null,
        trade_type: item.trade_type ?? null,
        partners: item.partners ?? null,
        investment: item.investment ?? null,
        status: item.status ?? null,
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type,
        project_name: item.project_name ?? null,
        product_type: item.product_type ?? null,
        data_source: item.data_source ?? null,
        technology_type: item.technology_type ?? null,
        announced_size: item.announced_size ?? null,
        references: item.references ?? null,
        status_dates: item.status_dates ?? null,
      } as PortItem,
    });

    const toGeoJSON = (rows: PortItem[]): GeoJSONFeatureCollection => ({
      type: 'FeatureCollection',
      features: rows
        .filter((r: PortItem) => r.latitude !== null && r.longitude !== null)
        .map((r: PortItem) => formatFeature(r)),
    });

    const rows: PortItem[] = result.rows.map((row) => {
      const announced_size = row.announced_size
        ? {
            unit: row.announced_size.unit || null,
            value: row.announced_size.value ? parseFloat(row.announced_size.value) : null,
            vessels: row.announced_size.vessels ? parseInt(row.announced_size.vessels, 10) : null,
            capacity_per_vessel: row.announced_size.capacity_per_vessel ? parseFloat(row.announced_size.capacity_per_vessel) : null,
            original_text: row.announced_size.original_text || null,
          }
        : null;

      const status_dates = row.status_dates
        ? {
            status: row.status_dates.status || null,
            date_online: row.status_dates.date_online || null,
            repurposed_new: row.status_dates.repurposed_new || null,
            decommission_date: row.status_dates.decommission_date || null,
            announced_start_date: row.status_dates.announced_start_date || null,
          }
        : null;

      return {
        id: row.id,
        internal_id: row.internal_id || null,
        ref_id: row.ref_id || null,
        name: row.project_name || null,
        city: row.city || null,
        country: row.country || null,
        trade_type: row.trade_type || null,
        partners: row.partners || null,
        investment: row.investment || null,
        status: status_dates?.status || null,
        latitude: row.latitude || null,
        longitude: row.longitude || null,
        type: row.type,
        project_name: row.project_name || null,
        product_type: row.product_type || null,
        data_source: row.data_source || null,
        technology_type: row.technology_type || null,
        announced_size,
        references: row.references || null,
        status_dates,
      };
    });

    console.log(`[INFO] Fetched ${rows.length} ports`);
    console.log(
      '[INFO] Ports with missing coordinates:',
      rows
        .filter((r: PortItem) => r.latitude === null || r.longitude === null)
        .map((r) => ({ internal_id: r.internal_id, project_name: r.project_name }))
    );

    return toGeoJSON(rows);
  } catch (err: unknown) {
    console.error('[getPortData ERROR]', err);
    throw new Error(`Failed to load Port data: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.release();
  }
}