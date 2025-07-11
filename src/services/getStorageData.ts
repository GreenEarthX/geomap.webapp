import pool from '@/lib/db';
import { StorageItem, GeoJSONFeatureCollection } from '@/lib/types2';

export async function getStorageData(): Promise<GeoJSONFeatureCollection> {
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
        CASE 
          WHEN data->'status'->>'date_online' ~ '^[0-9]+$' 
          THEN (data->'status'->>'date_online')::integer
          ELSE NULL
        END AS start_year,
        data->'status'->>'current_status' AS current_status,
        data->'status'->>'current_status' AS status,
        data->'status'->>'repurposed_new' AS repurposed_new,
        data->'status'->>'decommission_date' AS decommission_date,
        data->'status'->>'announced_start_date' AS announced_start_date,
        data->'status'->>'announced_construction' AS announced_construction,
        data->>'street' AS street,
        data->>'location' AS location,
        data->>'website_url' AS website_url,
        data->>'contact_name' AS contact_name,
        data->>'project_name' AS project_name,
        data->>'project_type' AS project_type,
        data->>'primary_product' AS primary_product,
        data->>'secondary_product' AS secondary_product,
        data->>'announced_size' AS announced_size,
        data->>'is_demo_project' AS is_demo_project,
        data->>'storage_technology' AS storage_technology,
        data->>'technology' AS technology,
        data->'stakeholders' AS stakeholders,
        data->'references' AS references,
        data->'additional_links' AS additional_links,
        data->'capacities'->'storage'->'energy_pj'->>'unit' AS storage_energy_pj_unit,
        CASE 
          WHEN data->'capacities'->'storage'->'energy_pj'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'storage'->'energy_pj'->>'value')::double precision
          ELSE NULL
        END AS storage_energy_pj_value,
        data->'capacities'->'storage'->'energy_gwh'->>'unit' AS storage_energy_gwh_unit,
        CASE 
          WHEN data->'capacities'->'storage'->'energy_gwh'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'storage'->'energy_gwh'->>'value')::double precision
          ELSE NULL
        END AS storage_energy_gwh_value,
        data->'capacities'->'storage'->'mass_kt_per_year'->>'unit' AS storage_mass_kt_per_year_unit,
        CASE 
          WHEN data->'capacities'->'storage'->'mass_kt_per_year'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'storage'->'mass_kt_per_year'->>'value')::double precision
          ELSE NULL
        END AS storage_mass_kt_per_year_value,
        data->'capacities'->'storage'->'volume_million_nm3'->>'unit' AS storage_volume_million_nm3_unit,
        CASE 
          WHEN data->'capacities'->'storage'->'volume_million_nm3'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'storage'->'volume_million_nm3'->>'value')::double precision
          ELSE NULL
        END AS storage_volume_million_nm3_value,
        data->'capacities'->'injection'->'power_mw'->>'unit' AS injection_power_mw_unit,
        CASE 
          WHEN data->'capacities'->'injection'->'power_mw'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'injection'->'power_mw'->>'value')::double precision
          ELSE NULL
        END AS injection_power_mw_value,
        data->'capacities'->'injection'->'mass_kt_per_day'->>'unit' AS injection_mass_kt_per_day_unit,
        CASE 
          WHEN data->'capacities'->'injection'->'mass_kt_per_day'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'injection'->'mass_kt_per_day'->>'value')::double precision
          ELSE NULL
        END AS injection_mass_kt_per_day_value,
        data->'capacities'->'injection'->'energy_gwh_per_day'->>'unit' AS injection_energy_gwh_per_day_unit,
        CASE 
          WHEN data->'capacities'->'injection'->'energy_gwh_per_day'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'injection'->'energy_gwh_per_day'->>'value')::double precision
          ELSE NULL
        END AS injection_energy_gwh_per_day_value,
        data->'capacities'->'withdrawal'->'power_mw'->>'unit' AS withdrawal_power_mw_unit,
        CASE 
          WHEN data->'capacities'->'withdrawal'->'power_mw'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'withdrawal'->'power_mw'->>'value')::double precision
          ELSE NULL
        END AS withdrawal_power_mw_value,
        data->'capacities'->'withdrawal'->'mass_kt_per_day'->>'unit' AS withdrawal_mass_kt_per_day_unit,
        CASE 
          WHEN data->'capacities'->'withdrawal'->'mass_kt_per_day'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'withdrawal'->'mass_kt_per_day'->>'value')::double precision
          ELSE NULL
        END AS withdrawal_mass_kt_per_day_value,
        data->'capacities'->'withdrawal'->'energy_gwh_per_day'->>'unit' AS withdrawal_energy_gwh_per_day_unit,
        CASE 
          WHEN data->'capacities'->'withdrawal'->'energy_gwh_per_day'->>'value' ~ '^[0-9]+(\\.[0-9]+)?$' 
          THEN (data->'capacities'->'withdrawal'->'energy_gwh_per_day'->>'value')::double precision
          ELSE NULL
        END AS withdrawal_energy_gwh_per_day_value,
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
      WHERE sector = 'Storage'
    `);

    const formatFeature = (item: StorageItem): GeoJSONFeatureCollection['features'][0] => ({
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
        repurposed_new: item.repurposed_new ?? '',
        decommission_date: item.decommission_date ?? '',
        announced_start_date: item.announced_start_date ?? '',
        announced_construction: item.announced_construction ?? '',
        street: item.street ?? '',
        location: item.location ?? '',
        website_url: item.website_url ?? '',
        contact_name: item.contact_name ?? '',
        project_name: item.project_name ?? '',
        project_type: item.project_type ?? '',
        primary_product: item.primary_product ?? '',
        secondary_product: item.secondary_product ?? '',
        announced_size: item.announced_size ?? '',
        is_demo_project: item.is_demo_project ?? '',
        storage_technology: item.storage_technology ?? '',
        technology: item.technology ?? '',
        stakeholders: Array.isArray(item.stakeholders) ? item.stakeholders : [],
        references: Array.isArray(item.references) ? item.references : [],
        additional_links: Array.isArray(item.additional_links) ? item.additional_links : [],
        storage_energy_pj_unit: item.storage_energy_pj_unit ?? '',
        storage_energy_pj_value: item.storage_energy_pj_value,
        storage_energy_gwh_unit: item.storage_energy_gwh_unit ?? '',
        storage_energy_gwh_value: item.storage_energy_gwh_value,
        storage_mass_kt_per_year_unit: item.storage_mass_kt_per_year_unit ?? '',
        storage_mass_kt_per_year_value: item.storage_mass_kt_per_year_value,
        storage_volume_million_nm3_unit: item.storage_volume_million_nm3_unit ?? '',
        storage_volume_million_nm3_value: item.storage_volume_million_nm3_value,
        injection_power_mw_unit: item.injection_power_mw_unit ?? '',
        injection_power_mw_value: item.injection_power_mw_value,
        injection_mass_kt_per_day_unit: item.injection_mass_kt_per_day_unit ?? '',
        injection_mass_kt_per_day_value: item.injection_mass_kt_per_day_value,
        injection_energy_gwh_per_day_unit: item.injection_energy_gwh_per_day_unit ?? '',
        injection_energy_gwh_per_day_value: item.injection_energy_gwh_per_day_value,
        withdrawal_power_mw_unit: item.withdrawal_power_mw_unit ?? '',
        withdrawal_power_mw_value: item.withdrawal_power_mw_value,
        withdrawal_mass_kt_per_day_unit: item.withdrawal_mass_kt_per_day_unit ?? '',
        withdrawal_mass_kt_per_day_value: item.withdrawal_mass_kt_per_day_value,
        withdrawal_energy_gwh_per_day_unit: item.withdrawal_energy_gwh_per_day_unit ?? '',
        withdrawal_energy_gwh_per_day_value: item.withdrawal_energy_gwh_per_day_value,
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type,
      } as StorageItem,
    });

    const toGeoJSON = (rows: StorageItem[]): GeoJSONFeatureCollection => ({
      type: 'FeatureCollection',
      features: rows
        .filter((r: StorageItem) => r.latitude !== null && r.longitude !== null)
        .map((r: StorageItem) => formatFeature(r)),
    });

    const rows: StorageItem[] = result.rows;
    console.log(`[INFO] Missing coordinates - Storage: ${rows.filter((r: StorageItem) => r.latitude === null || r.longitude === null).length}`);

    return toGeoJSON(rows);
  } catch (err: unknown) {
    console.error('[getStorageData ERROR]', err);
    throw new Error('Failed to load Storage data');
  } finally {
    client.release();
  }
}
