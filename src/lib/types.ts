// In a file like lib/types.ts

// The structure of the nested JSONB 'data' field in your database
export interface ProjectData {
  // Common properties
  plant_name?: string;
  project_name?: string;
  city?: string | null;
  country?: string | null;
  coordinates?: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  status?: {
    current_status: string | null;
    date_online: string | null; // e.g., "2015.0"
  } | null;
  capacity?: {
    mw?: number;
    capacity_mw_el?: number;
    // Add any other capacity variants you have
  } | null;
  end_use?: string[] | string | null;
  technology?: string | null;
  process?: string | null;
  consumption_tpy?: number | null;
  last_researched?: string | null;
  location?: string | null;

  // Pipeline specific properties
  pipeline_nr?: number;
  segment?: string;
  start?: string;
  stop?: string;
  approx_location_start?: string;
  approx_location_stop?: string;
  start_coordinates?: { latitude: number; longitude: number; };
  end_coordinates?: { latitude: number; longitude: number; };
}

// Represents a single row from your 'project_map' table
export interface ProjectMapTableRow {
  id: number;
  internal_id: string;
  data: ProjectData;
  sector: string | null;
}

// These are the flat properties your map component uses.
// This is very similar to your existing 'Feature.properties' interface.
export interface MapFeatureProperties {
  id: number;
  name?: string;
  status?: string | null;
  type?: string;
  start_year?: number | null;
  capacity_mw?: number | null;
  process?: string | null;
  end_use?: string | null;
  consumption_tpy?: number | null;
  city?: string | null;
  country?: string | null;
  technology?: string | null;
  location?: string | null;
  pipeline_nr?: number;
  segment?: string;
  start?: string;
  stop?: string;
  approx_location_start?: string;
  approx_location_stop?: string;
}

// A standard GeoJSON Feature object, strongly typed
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString';
    coordinates: [number, number] | [number, number][];
  };
  properties: MapFeatureProperties;
}

// A standard GeoJSON FeatureCollection, strongly typed
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// The final structure of the API response
export interface MapDataSets {
  hydrogen: GeoJSONFeatureCollection;
  wind: GeoJSONFeatureCollection;
  solar: GeoJSONFeatureCollection;
  storage: GeoJSONFeatureCollection;
  pipelines: GeoJSONFeatureCollection;
}


export interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    internal_id: string;
    name: string;
    type: string;
    status: string;
    start_year: number;
    capacity_mw: number;
    process: string;
    end_use: string;
    consumption_tpy: number;
    city: string;
    country: string;
    pipeline_name?: string;
    capacity_kt_y?: number | null;
    announced_size?: { unit: string; value: number; vessels?: number; capacity_per_vessel?: number };
    trade_type?: string;
    partners?: string;
    investment?: { costs_musd: string };
    segment_id?: string;
    segment_order?: number;
    start_location?: string;
    stop_location?: string;
    pipeline_number?: string;
    infrastructure_type?: string;
    total_segments?: number;
  };
}