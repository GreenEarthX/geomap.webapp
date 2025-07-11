
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlantFormFeature } from '@/lib/types2';

interface ProductionFormProps {
  initialFeature: PlantFormFeature | null;
  initialError: string | null;
}

interface FieldConfig {
  name: keyof PlantFormFeature['properties'];
  label: string;
  type: string;
  placeholder: string;
}

const ProductionForm = ({ initialFeature, initialError }: ProductionFormProps) => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const feature: ProductionFormProps['initialFeature'] = initialFeature || {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
      id: '',
      internal_id: id || '',
      name: 'Placeholder Production',
      type: 'Production',
      status: '',
      start_year: null,
      city: null,
      country: null,
      zip: null,
      email: null,
      owner: null,
      ref_id: null,
      date_online: null,
      current_status: null,
      completion_date: null,
      street: null,
      website_url: null,
      contact_name: null,
      project_name: null,
      project_type: null,
      primary_product: null,
      secondary_product: null,
      references: null,
      technology: null,
      capacity_unit: null,
      capacity_value: null,
      end_use: null,
      stakeholders: null,
      latitude: null,
      longitude: null,
    },
  };

  const initialFormData: PlantFormFeature['properties'] = {
    internal_id: feature.properties.internal_id ?? id,
    name: feature.properties.name ?? 'Placeholder Production',
    type: feature.properties.type ?? 'Production',
    status: feature.properties.status ?? '',
    start_year: feature.properties.start_year ?? null,
    city: feature.properties.city ?? '',
    country: feature.properties.country ?? '',
    zip: feature.properties.zip ?? '',
    email: feature.properties.email ?? '',
    owner: feature.properties.owner ?? '',
    ref_id: feature.properties.ref_id ?? '',
    date_online: feature.properties.date_online ?? '',
    current_status: feature.properties.current_status ?? '',
    completion_date: feature.properties.completion_date ?? '',
    street: feature.properties.street ?? '',
    website_url: feature.properties.website_url ?? '',
    contact_name: feature.properties.contact_name ?? '',
    project_name: feature.properties.project_name ?? '',
    project_type: feature.properties.project_type ?? '',
    primary_product: feature.properties.primary_product ?? '',
    secondary_product: feature.properties.secondary_product ?? '',
    references: feature.properties.references ?? '',
    technology: feature.properties.technology ?? '',
    capacity_unit: feature.properties.capacity_unit ?? '',
    capacity_value: feature.properties.capacity_value ?? null,
    end_use: feature.properties.end_use ?? [],
    stakeholders: feature.properties.stakeholders ?? [],
    latitude: feature.properties.latitude ?? null,
    longitude: feature.properties.longitude ?? null,
  };

  const [formData, setFormData] = useState<PlantFormFeature['properties']>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'capacity_value' || name === 'start_year'
      ? parseFloat(value) || null
      : name === 'end_use' || name === 'stakeholders'
      ? value.split(',').map((v) => v.trim()).filter((v) => v)
      : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/update-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'production', data: formData }),
      });

      if (response.ok) {
        setIsEditing(false);
        const notification = document.createElement('div');
        notification.className =
          'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
        notification.textContent = 'Changes saved successfully!';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (error) {
      console.error('Save error:', error);
      const notification = document.createElement('div');
      notification.className =
        'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
      notification.textContent = 'Failed to save changes';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  const renderFields = () => {
    const fields: FieldConfig[] = [
      { name: 'project_name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
      { name: 'name', label: 'Plant Name', type: 'text', placeholder: 'Enter plant name' },
      { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Concept, Operational' },
      { name: 'start_year', label: 'Start Year', type: 'number', placeholder: 'YYYY' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      { name: 'zip', label: 'Zip Code', type: 'text', placeholder: 'Zip code' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Contact email' },
      { name: 'owner', label: 'Owner', type: 'text', placeholder: 'Owner name' },
      { name: 'ref_id', label: 'Reference ID', type: 'text', placeholder: 'Reference ID' },
      { name: 'date_online', label: 'Date Online', type: 'text', placeholder: 'Date online' },
      { name: 'current_status', label: 'Current Status', type: 'text', placeholder: 'Current status' },
      { name: 'completion_date', label: 'Completion Date', type: 'text', placeholder: 'Completion date' },
      { name: 'street', label: 'Street', type: 'text', placeholder: 'Street address' },
      { name: 'website_url', label: 'Website URL', type: 'url', placeholder: 'Website URL' },
      { name: 'contact_name', label: 'Contact Name', type: 'text', placeholder: 'Contact name' },
      { name: 'project_type', label: 'Project Type', type: 'text', placeholder: 'Project type' },
      { name: 'primary_product', label: 'Primary Product', type: 'text', placeholder: 'Primary product' },
      { name: 'secondary_product', label: 'Secondary Product', type: 'text', placeholder: 'Secondary product' },
      { name: 'references', label: 'References', type: 'text', placeholder: 'References' },
      { name: 'technology', label: 'Technology', type: 'text', placeholder: 'Technology used' },
      { name: 'capacity_unit', label: 'Capacity Unit', type: 'text', placeholder: 'e.g. MW' },
      { name: 'capacity_value', label: 'Capacity Value', type: 'number', placeholder: 'Capacity value' },
      { name: 'end_use', label: 'End Use', type: 'text', placeholder: 'Comma-separated end uses' },
      { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Comma-separated stakeholders' },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {isEditing && field.type === 'number' && (
                <span className="ml-1 text-xs text-gray-500">(numeric)</span>
              )}
            </label>
            <input
              type={field.type}
              name={field.name}
              value={
                field.name === 'end_use' || field.name === 'stakeholders'
                  ? (formData[field.name] as string[])?.join(', ') || ''
                  : String(formData[field.name] ?? '')
              }
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder={field.placeholder}
              className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                isEditing ? 'bg-white hover:border-gray-400' : 'bg-gray-50 cursor-not-allowed'
              } text-black`}
            />
          </div>
        ))}
      </div>
    );
  };

  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm max-w-lg w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{initialError}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Back to Map
              </button>
              <button
                onClick={() => router.push('/plant-list')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-18-8h18m-18 12h18"
                  />
                </svg>
                Plant List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm max-w-4xl w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">
              {feature.properties.name || 'Production Feature Details'}
            </h2>
            <p className="text-gray-500 capitalize text-sm sm:text-base">Production Project</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
              isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              )}
            </svg>
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
          <div className="flex flex-col sm:flex-row justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Back to Map
              </button>
              <button
                type="button"
                onClick={() => router.push('/plant-list')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-18-8h18m-18 12h18"
                  />
                </svg>
                Plant List
              </button>
            </div>
            {isEditing && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialFormData);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
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

export default ProductionForm;
