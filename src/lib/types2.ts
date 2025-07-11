
export interface ProductionItem {
  id: string;
  internal_id: string | null;
  name: string | null;
  city: string | null;
  country: string | null;
  zip: string | null;
  email: string | null;
  owner: string | null;
  ref_id: string | null;
  date_online: string | null;
  current_status: string | null;
  status: string | null;
  start_year: number | null;
  completion_date: string | null;
  street: string | null;
  website_url: string | null;
  contact_name: string | null;
  project_name: string | null;
  project_type: string | null;
  primary_product: string | null;
  secondary_product: string | null;
  references: string | null;
  technology: string | null;
  capacity_unit: string | null;
  capacity_value: number | null;
  end_use: string[] | null;
  stakeholders: string[] | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

export interface StorageItem {
  id: string;
  internal_id: string | null;
  name: string | null;
  city: string | null;
  country: string | null;
  zip: string | null;
  email: string | null;
  owner: string | null;
  ref_id: string | null;
  date_online: string | null;
  current_status: string | null;
  status: string | null;
  start_year: number | null;
  repurposed_new: string | null;
  decommission_date: string | null;
  announced_start_date: string | null;
  announced_construction: string | null;
  street: string | null;
  location: string | null;
  website_url: string | null;
  contact_name: string | null;
  project_name: string | null;
  project_type: string | null;
  primary_product: string | null;
  secondary_product: string | null;
  announced_size: string | null;
  is_demo_project: string | null;
  storage_technology: string | null;
  technology: string | null;
  stakeholders: string[] | null;
  references: string[] | null;
  additional_links: string[] | null;
  storage_energy_pj_unit: string | null;
  storage_energy_pj_value: number | null;
  storage_energy_gwh_unit: string | null;
  storage_energy_gwh_value: number | null;
  storage_mass_kt_per_year_unit: string | null;
  storage_mass_kt_per_year_value: number | null;
  storage_volume_million_nm3_unit: string | null;
  storage_volume_million_nm3_value: number | null;
  injection_power_mw_unit: string | null;
  injection_power_mw_value: number | null;
  injection_mass_kt_per_day_unit: string | null;
  injection_mass_kt_per_day_value: number | null;
  injection_energy_gwh_per_day_unit: string | null;
  injection_energy_gwh_per_day_value: number | null;
  withdrawal_power_mw_unit: string | null;
  withdrawal_power_mw_value: number | null;
  withdrawal_mass_kt_per_day_unit: string | null;
  withdrawal_mass_kt_per_day_value: number | null;
  withdrawal_energy_gwh_per_day_unit: string | null;
  withdrawal_energy_gwh_per_day_value: number | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

export interface CCUSReference {
  ref: string | null;
  link: string | null;
}

export interface CCUSItem {
  id: string;
  internal_id: string | null;
  name: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  street: string | null;
  email: string | null;
  owner: string | null;
  contact: string | null;
  website: string | null;
  product: string | null;
  zip_code: string | null;
  project_id: string | null;
  data_source: string | null;
  last_updated: string | null;
  project_name: string | null;
  project_type: string | null;
  stakeholders: string | null;
  end_use_sector: string | null;
  technology_fate: string | null;
  investment_capex: string | null;
  part_of_ccus_hub: string | null;
  fid_date: string | null;
  project_phase: string | null;
  operation_date: string | null;
  project_status: string | null;
  status: string | null;
  start_year: number | null;
  suspension_date: string | null;
  announcement_date: string | null;
  capacity_unit: string | null;
  capacity_announced_unit: string | null;
  capacity_announced_value: number | null;
  capacity_estimated_unit: string | null;
  capacity_estimated_value: number | null;
  references: CCUSReference[] | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

export interface PortItem {
  id: string;
  internal_id: string | null;
  ref_id: string | null;
  name: string | null;
  city: string | null;
  country: string | null;
  trade_type: string | null;
  partners: string | null;
  investment: { costs_musd: string | null } | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
  project_name: string | null;
  product_type: string | null;
  data_source: string | null;
  technology_type: string | null;
  announced_size: {
    unit: string | null;
    value: number | null;
    vessels?: number | null;
    capacity_per_vessel?: number | null;
    original_text?: string | null;
  } | null;
  references: { [key: string]: string | null } | null;
  status_dates: {
    status: string | null;
    date_online: string | null;
    repurposed_new: string | null;
    decommission_date: string | null;
    announced_start_date: string | null;
  } | null;
}

export interface PipelineItem {
  id: string;
  pipeline_name: string | null;
  start_location: string | null;
  stop_location: string | null;
  segment_id: string | null;
  segment_order: number | null;
  pipeline_number: string | null;
  infrastructure_type: string | null;
  total_segments: number | null;
  status: string | null;
  type: string;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: {
      type: 'Point' | 'LineString';
      coordinates: [number, number] | [number, number][];
    };
    properties: ProductionItem | StorageItem | CCUSItem | PortItem | PipelineItem;
  }[];
}

// Add LeafletFeature and PlantFormFeature to align with ProductionItem
export interface LeafletFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: ProductionItem; // Only ProductionItem for now, extend for other types as needed
}

export interface PlantFormFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Partial<ProductionItem>;
}
