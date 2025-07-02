'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Feature } from './LeafletMap';

interface PlantFormProps {
  initialFeature: Feature | null;
  initialError: string | null;
}

type FeatureType = 'hydrogen' | 'wind' | 'solar' | 'storage' | 'pipeline';

interface FieldConfig {
  name: keyof Feature['properties'];
  label: string;
  type: string;
  placeholder: string;
}

interface DataSource {
  url: string;
  tableReference: string;
  lastUpdated: string;
}

const PlantForm = ({ initialFeature, initialError }: PlantFormProps) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);

  // Hardcoded feature data source information
  const dataSources: Record<FeatureType, DataSource> = {
    hydrogen: {
      url: "https://example.com/datasets/hydrogen-projects",
      tableReference: "Table 3, Row 42",
      lastUpdated: "2023-11-15T14:30:00Z"
    },
    wind: {
      url: "https://example.com/datasets/wind-farms",
      tableReference: "Table 7, Row 18",
      lastUpdated: "2023-10-22T09:15:00Z"
    },
    solar: {
      url: "https://example.com/datasets/solar-plants",
      tableReference: "Table 2, Row 56",
      lastUpdated: "2023-09-05T16:45:00Z"
    },
    storage: {
      url: "https://example.com/datasets/energy-storage",
      tableReference: "Table 5, Row 23",
      lastUpdated: "2023-12-01T11:20:00Z"
    },
    pipeline: {
      url: "https://example.com/datasets/pipeline-networks",
      tableReference: "Table 1, Row 89",
      lastUpdated: "2023-08-17T13:10:00Z"
    }
  };

  // Define valid types and compute feature type
  const validTypes: FeatureType[] = ['hydrogen', 'wind', 'solar', 'storage', 'pipeline'];
  const featureType = validTypes.includes(type.toLowerCase() as FeatureType) 
    ? type.toLowerCase() as FeatureType 
    : 'hydrogen';

  // Compute feature and ensure consistent properties
  const feature: Feature = initialFeature || {
    type: 'Feature',
    geometry: {
      type: featureType === 'pipeline' ? 'LineString' : 'Point',
      coordinates: featureType === 'pipeline' ? [[0, 0], [1, 1]] : [0, 0],
    },
    properties: {
      id: parseInt(id, 10) || 0,
      name: 'Placeholder Feature',
      type: featureType,
    },
  };

  // Initialize formData with feature.properties
  const initialFormData: Partial<Feature['properties']> = {
    id: (feature.properties.id ?? parseInt(id, 10)) || 0,
    name: feature.properties.name ?? 'Placeholder Feature',
    type: feature.properties.type ?? featureType,
    status: feature.properties.status ?? '',
    start_year: feature.properties.start_year ?? 0,
    capacity_mw: feature.properties.capacity_mw ?? 0,
    process: feature.properties.process ?? '',
    end_use: feature.properties.end_use ?? '',
    consumption_tpy: feature.properties.consumption_tpy ?? 0,
    city: feature.properties.city ?? '',
    country: feature.properties.country ?? '',
    last_researched: feature.properties.last_researched ?? '',
    technology: feature.properties.technology ?? '',
    location: feature.properties.location ?? '',
    pipeline_nr: feature.properties.pipeline_nr ?? 0,
    segment: feature.properties.segment ?? '',
    start: feature.properties.start ?? '',
    stop: feature.properties.stop ?? '',
    approx_location_start: feature.properties.approx_location_start ?? '',
    approx_location_stop: feature.properties.approx_location_stop ?? '',
  };

  const [formData, setFormData] = useState<Partial<Feature['properties']>>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = ['start_year', 'capacity_mw', 'consumption_tpy', 'pipeline_nr', 'id'].includes(name)
      ? parseFloat(value) || 0
      : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
    notification.textContent = 'Changes saved successfully!';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const renderFields = () => {
    const type = feature.properties.type || featureType;
    const fields: Record<FeatureType, FieldConfig[]> = {
      hydrogen: [
        { name: 'name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
        { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Planned, Operational' },
        { name: 'start_year', label: 'Start Year', type: 'number', placeholder: 'YYYY' },
        { name: 'capacity_mw', label: 'Capacity (MW)', type: 'number', placeholder: 'Enter capacity' },
        { name: 'process', label: 'Process', type: 'text', placeholder: 'Production process' },
        { name: 'end_use', label: 'End Use', type: 'text', placeholder: 'Final product use' },
        { name: 'consumption_tpy', label: 'Consumption (t/y)', type: 'number', placeholder: 'Annual consumption' },
        { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
        { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      ],
      wind: [
        { name: 'name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
        { name: 'capacity_mw', label: 'Capacity (MW)', type: 'number', placeholder: 'Enter capacity' },
        { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Planned, Operational' },
        { name: 'start_year', label: 'Start Year', type: 'number', placeholder: 'YYYY' },
        { name: 'last_researched', label: 'Last Researched', type: 'text', placeholder: 'Date of last research' },
      ],
      solar: [
        { name: 'name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
        { name: 'capacity_mw', label: 'Capacity (MW)', type: 'number', placeholder: 'Enter capacity' },
        { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Planned, Operational' },
        { name: 'start_year', label: 'Start Year', type: 'number', placeholder: 'YYYY' },
        { name: 'last_researched', label: 'Last Researched', type: 'text', placeholder: 'Date of last research' },
      ],
      storage: [
        { name: 'name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
        { name: 'technology', label: 'Technology', type: 'text', placeholder: 'Storage technology' },
        { name: 'location', label: 'Location', type: 'text', placeholder: 'Storage location' },
        { name: 'start_year', label: 'Start Year', type: 'number', placeholder: 'YYYY' },
      ],
      pipeline: [
        { name: 'pipeline_nr', label: 'Pipeline #', type: 'number', placeholder: 'Pipeline number' },
        { name: 'segment', label: 'Segment', type: 'text', placeholder: 'Pipeline segment' },
        { name: 'start', label: 'Start', type: 'text', placeholder: 'Starting point' },
        { name: 'stop', label: 'Stop', type: 'text', placeholder: 'End point' },
        { name: 'approx_location_start', label: 'Start Location', type: 'text', placeholder: 'Approximate start location' },
        { name: 'approx_location_stop', label: 'Stop Location', type: 'text', placeholder: 'Approximate end location' },
      ],
    };

    const fieldElements = fields[type as FeatureType]?.map((field: FieldConfig) => (
      <div key={field.name} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {isEditing && (
            <span className="ml-1 text-xs text-gray-500">
              {field.type === 'number' ? '(numeric)' : ''}
            </span>
          )}
        </label>
        <input
          type={field.type}
          name={field.name}
          value={String(formData[field.name] ?? '')}
          onChange={handleInputChange}
          disabled={!isEditing}
          placeholder={field.placeholder}
          className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#006CB5] focus:border-[#006CB5] transition-all duration-200 ${
            isEditing 
              ? 'bg-white border-gray-300 shadow-sm hover:border-gray-400' 
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        />
      </div>
    ));

    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{fieldElements}</div>;
  };

  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#e0f7fa] to-[#e8f5e9]">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#003B70] mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{initialError}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-[#006CB5] text-white rounded-lg hover:bg-[#003B70] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#e0f7fa] to-[#e8f5e9] font-sans">
      {/* Data Source Modal */}
      {showDataSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#003B70]">Data Source Information</h3>
              <button 
                onClick={() => setShowDataSourceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Dataset URL</p>
                <a 
                  href={dataSources[featureType].url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {dataSources[featureType].url}
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Table Reference</p>
                <p className="text-gray-700">{dataSources[featureType].tableReference}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-gray-700">
                  {new Date(dataSources[featureType].lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowDataSourceModal(false)}
                className="w-full px-4 py-2 bg-[#006CB5] text-white rounded-lg hover:bg-[#003B70] transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl w-full relative">
        {/* Data source button */}
        <button
          onClick={() => setShowDataSourceModal(true)}
          className="absolute top-4 right-4 flex items-center text-sm text-gray-600 hover:text-[#006CB5]"
          title="View data source"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Data Source
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#003B70]">
              {feature.properties.name || 'Feature Details'}
            </h2>
            <p className="text-gray-500 capitalize">{featureType} Project</p>
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {new Date(dataSources[featureType].lastUpdated).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
              isEditing 
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                : 'bg-[#006CB5] hover:bg-[#003B70] text-white shadow-md'
            }`}
          >
            <svg 
              className={`w-5 h-5 mr-2 transition-transform duration-200 ${isEditing ? 'rotate-45' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isEditing ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              )}
            </svg>
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-700 text-sm">
              {isEditing 
                ? 'You are now editing this project. Make your changes and click Save when done.' 
                : 'Viewing project details. Click Edit to make changes.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {renderFields()}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Back to Map
            </button>
            {isEditing && (
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialFormData);
                    setIsEditing(false);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#006CB5] text-white rounded-lg hover:bg-[#003B70] transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlantForm;