'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id?: number;
    internal_id?: string;
    name?: string;
    status?: string;
    type?: string;
    capacity_kt_y?: number | null;
    announced_size?: { unit: string; value: number; vessels?: number; capacity_per_vessel?: number } | null;
    trade_type?: string;
    partners?: string;
    investment?: { costs_musd: string } | null;
    city?: string;
    country?: string;
  };
}

interface PortFormProps {
  initialFeature: Feature | null;
  initialError: string | null;
}

interface FieldConfig {
  name: keyof Feature['properties'] | string;
  label: string;
  type: string;
  placeholder: string;
  disabled?: boolean;
}

const PortForm = ({ initialFeature, initialError }: PortFormProps) => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const resolvedType = initialFeature?.properties?.type ?? 'Port';
  const feature: Feature = initialFeature || {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0],
    },
    properties: {
      internal_id: id || '',
      name: 'Placeholder Port',
      type: resolvedType,
      status: '',
      capacity_kt_y: null,
      announced_size: { unit: '', value: 0 },
      trade_type: '',
      partners: '',
      investment: { costs_musd: '' },
      city: '',
      country: '',
    },
  };

  const initialFormData: Partial<Feature['properties']> = {
    internal_id: feature.properties.internal_id ?? id,
    name: feature.properties.name ?? 'Placeholder Port',
    type: feature.properties.type ?? 'Port',
    status: feature.properties.status ?? '',
    capacity_kt_y: feature.properties.capacity_kt_y ?? null,
    announced_size: feature.properties.announced_size ?? { unit: '', value: 0 },
    trade_type: feature.properties.trade_type ?? '',
    partners: feature.properties.partners ?? '',
    investment: feature.properties.investment ?? { costs_musd: '' },
    city: feature.properties.city ?? '',
    country: feature.properties.country ?? '',
  };

  const [formData, setFormData] = useState<Partial<Feature['properties']>>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('announced_size.')) {
      const key = name.split('.')[1] as keyof NonNullable<Feature['properties']['announced_size']>;
      setFormData((prev) => ({
        ...prev,
        announced_size: {
          ...(prev.announced_size ?? { unit: '', value: 0 }),
          [key]: key === 'value' || key === 'vessels' || key === 'capacity_per_vessel' ? parseFloat(value) || 0 : value,
        },
      }));
    } else if (name.startsWith('investment.')) {
      const key = name.split('.')[1] as keyof NonNullable<Feature['properties']['investment']>;
      setFormData((prev) => ({
        ...prev,
        investment: {
          ...(prev.investment ?? { costs_musd: '' }),
          [key]: value,
        },
      }));
    } else {
      const parsedValue = name === 'capacity_kt_y' ? parseFloat(value) || null : value;
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const renderFields = () => {
    const fields: FieldConfig[] = [
      { name: 'name', label: 'Project Name', type: 'text', placeholder: 'Enter port project name' },
      { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Concept, Operational' },
      { name: 'trade_type', label: 'Trade Type', type: 'text', placeholder: 'e.g. Import, Export' },
      { name: 'capacity_kt_y', label: 'Capacity (kt/y)', type: 'number', placeholder: 'Enter capacity' },
      { name: 'announced_size.unit', label: 'Announced Size Unit', type: 'text', placeholder: 'e.g. kt/y' },
      { name: 'announced_size.value', label: 'Announced Size Value', type: 'number', placeholder: 'Enter size value' },
      { name: 'announced_size.vessels', label: 'Number of Vessels', type: 'number', placeholder: 'Enter number of vessels' },
      {
        name: 'announced_size.capacity_per_vessel',
        label: 'Capacity per Vessel',
        type: 'number',
        placeholder: 'Enter capacity per vessel',
      },
      { name: 'partners', label: 'Partners', type: 'text', placeholder: 'Enter partners' },
      { name: 'investment.costs_musd', label: 'Investment (MUSD)', type: 'text', placeholder: 'Enter investment cost' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      { name: 'type', label: 'Type', type: 'text', placeholder: 'Port', disabled: true },
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
                field.name.startsWith('announced_size.')
                  ? String(formData.announced_size?.[field.name.split('.')[1] as keyof NonNullable<Feature['properties']['announced_size']>] ?? '')
                  : field.name.startsWith('investment.')
                  ? String(formData.investment?.[field.name.split('.')[1] as keyof NonNullable<Feature['properties']['investment']>] ?? '')
                  : String(formData[field.name as keyof Feature['properties']] ?? '')
              }
              onChange={handleInputChange}
              disabled={!isEditing || field.disabled}
              placeholder={field.placeholder}
              className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                isEditing && !field.disabled ? 'bg-white hover:border-gray-400' : 'bg-gray-50 cursor-not-allowed'
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
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">
              Error Loading Data
            </h2>
            <p className="text-gray-600 mb-6">{initialError}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Back to Map
              </button>
              <button
                onClick={() => router.push('/port-list')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-18-8h18m-18 12h18"
                  />
                </svg>
                Port List
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
              {formData.name || 'Port Details'}
            </h2>
            <p className="text-gray-500 capitalize text-sm sm:text-base">
              {formData.type ? `${formData.type} Project` : 'Unknown Project Type'}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg
              className={`w-5 h-5 mr-2 transition-transform duration-200 ${isEditing ? 'rotate-45' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isEditing ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
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
            <svg
              className="w-5 h-5 text-blue-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-blue-700 text-sm">
              {isEditing
                ? 'You are now editing this port. Make your changes and click Save when done.'
                : 'Viewing port details. Click Edit to make changes.'}
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
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Back to Map
              </button>
              <button
                type="button"
                onClick={() => router.push('/plant-list')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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

export default PortForm;
