export interface ProductionItem {
  id: string;
  internal_id: string | null;
  name: string | null;
  city: string | null;
  country: string | null;
  zip: string | null;
  email: string | null;
  owner: string | null;
  date_online: string | null;
  status: string | null;
  street: string | null;
  website_url: string | null;
  contact_name: string | null;
  project_name: string | null;
  project_type: string | null;
  primary_product: string | null;
  secondary_product: string | null;
  technology: string | null;
  capacity_unit: string | null;
  capacity_value: number | null;
  end_use: string[] | null;
  stakeholders: string[] | null;
  investment_capex: string | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
  project_status: string | null;
  operation_date: string | null;
}

export interface StorageItem {
  id: string;
  internal_id: string | null;
  city: string | null;
  country: string | null;
  zip: string | null;
  email: string | null;
  owner: string | null;
  date_online: string | null;
  status: string | null;
  street: string | null;
  website_url: string | null;
  contact_name: string | null;
  project_name: string | null;
  project_type: string | null;
  primary_product: string | null;
  secondary_product: string | null;
  capacity_unit: string | null;
  capacity_value: number | null;
  stakeholders: string[] | null;
  storage_mass_kt_per_year_unit: string | null;
  storage_mass_kt_per_year_value: number | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
  technology: string | null;
  end_use: string | null;
  investment_capex: string | null;
  project_status: string | null;
  operation_date: string | null;
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
  street: string | null;
  zip_code: string | null;
  email: string | null;
  owner: string | null;
  contact: string | null;
  website: string | null;
  project_name: string | null;
  project_type: string | null;
  stakeholders: string[] | null;
  project_status: string | null;
  operation_date: string | null;
  product: string | null;
  technology_fate: string | null;
  end_use_sector: string[] | null;
  capacity_unit: string | null;
  capacity_value: number | null;
  investment_capex: string | null;
  references: CCUSReference[] | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
  date_online: string | null;
}

export interface PortItem {
  id: string;
  internal_id: string | null;
  line_number: string | null;
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

export interface LeafletFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: ProductionItem;
}

export interface PlantFormFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Partial<ProductionItem>;
}