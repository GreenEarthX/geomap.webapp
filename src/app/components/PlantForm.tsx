'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductionItem, StorageItem, CCUSItem } from '@/lib/types2';

type FeatureType = ProductionItem | StorageItem | CCUSItem;

interface PlantFormProps {
  initialFeature: FeatureType | null;
  initialError: string | null;
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

const PlantForm = ({ initialFeature, initialError }: PlantFormProps) => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const resolvedType = type || initialFeature?.type || 'Production';
  const sector = resolvedType.toLowerCase();

  const initialFormData: Partial<FeatureType> =
    sector === 'production'
      ? {
          internal_id: initialFeature?.internal_id ?? id ?? '',
          name: initialFeature?.project_name ?? 'Placeholder Feature',
          type: initialFeature?.type ?? resolvedType,
          status: initialFeature?.project_status ?? '',
          date_online: initialFeature?.date_online ?? '',
          city: initialFeature?.city ?? '',
          country: initialFeature?.country ?? '',
          capacity_value: (initialFeature as ProductionItem | undefined)?.capacity_value ?? 0,
          technology: (initialFeature as ProductionItem | undefined)?.technology ?? '',
          end_use: (initialFeature as ProductionItem | undefined)?.end_use ?? [],
          stakeholders: (initialFeature as ProductionItem | undefined)?.stakeholders ?? [],
        }
      : sector === 'storage'
      ? {
          internal_id: initialFeature?.internal_id ?? id ?? '',
          project_name: initialFeature?.project_name ?? 'Placeholder Feature',
          type: initialFeature?.type ?? resolvedType,
          status: initialFeature?.project_status ?? '',
          date_online: initialFeature?.date_online ?? '',
          city: initialFeature?.city ?? '',
          country: initialFeature?.country ?? '',
          storage_mass_kt_per_year_value: (initialFeature as StorageItem | undefined)?.storage_mass_kt_per_year_value ?? 0,
          storage_mass_kt_per_year_unit: (initialFeature as StorageItem | undefined)?.storage_mass_kt_per_year_unit ?? '',
          stakeholders: (initialFeature as StorageItem | undefined)?.stakeholders ?? [],
        }
      : sector === 'ccus'
      ? {
          internal_id: initialFeature?.internal_id ?? id ?? '',
          name: initialFeature?.project_name ?? 'Placeholder Feature',
          type: initialFeature?.type ?? resolvedType,
          project_status: initialFeature?.project_status ?? '',
          operation_date: initialFeature?.operation_date ?? '',
          city: initialFeature?.city ?? '',
          country: initialFeature?.country ?? '',
          capacity_value: (initialFeature as CCUSItem | undefined)?.capacity_value ?? 0,
          technology_fate: (initialFeature as CCUSItem | undefined)?.technology_fate ?? '',
          end_use_sector: (initialFeature as CCUSItem | undefined)?.end_use_sector ?? [],
          stakeholders: (initialFeature as CCUSItem | undefined)?.stakeholders ?? [],
        }
      : {
          internal_id: id ?? '',
          project_name: 'Placeholder Feature',
          type: resolvedType,
          status: '',
          date_online: '',
          city: '',
          country: '',
        };

  const [formData, setFormData] = useState<Partial<FeatureType>>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue =
      ['capacity_value', 'storage_mass_kt_per_year_value'].includes(name)
        ? parseFloat(value) || 0
        : ['end_use', 'stakeholders'].includes(name) && sector !== 'ccus'
        ? value.split(',').map((v) => v.trim()).filter(Boolean)
        : name === 'end_use_sector' && sector === 'ccus'
        ? value.split(',').map((v) => v.trim()).filter(Boolean)
        : name === 'stakeholders' && sector === 'ccus'
        ? value
        : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);

    try {
      const endpoint = `/api/${sector}`;
      const dataPayload = {
        ...formData,
        // Map form fields to database JSON structure
        data: {
          plant_name: (formData as ProductionItem | CCUSItem).name ?? formData.project_name,
          project_name: formData.project_name ?? (formData as ProductionItem | CCUSItem).name,
          status: {
            current_status: formData.project_status,
            date_online: formData.date_online ?? formData.operation_date,
          },
          coordinates: {
            latitude: formData.latitude ?? 0,
            longitude: formData.longitude ?? 0,
          },
          city: formData.city,
          country: formData.country,
          ...(sector === 'production' && {
            capacity: {
              value: (formData as ProductionItem).capacity_value,
              unit: (formData as ProductionItem).capacity_unit ?? '',
            },
            technology: (formData as ProductionItem).technology,
            end_use: (formData as ProductionItem).end_use?.join(','),
            stakeholders: (formData as ProductionItem).stakeholders?.join(','),
          }),
          ...(sector === 'storage' && {
            capacities: {
              storage: {
                mass_kt_per_year: {
                  value: (formData as StorageItem).storage_mass_kt_per_year_value,
                  unit: (formData as StorageItem).storage_mass_kt_per_year_unit,
                },
              },
            },
            stakeholders: (formData as StorageItem).stakeholders?.join(','),
          }),
          ...(sector === 'ccus' && {
            capacity: {
              value: (formData as CCUSItem).capacity_value,
              unit: (formData as CCUSItem).capacity_unit ?? '',
            },
            technology_fate: (formData as CCUSItem).technology_fate,
            end_use_sector: (formData as CCUSItem).end_use_sector?.join(','),
            stakeholders: (formData as CCUSItem).stakeholders?.join(','),
            status_date: {
              project_status: (formData as CCUSItem).project_status,
              operation_date: (formData as CCUSItem).operation_date,
            },
          }),
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${sector} data`);
      }

      const notification = document.createElement('div');
      notification.className =
        'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
      notification.textContent = 'Changes saved successfully!';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    } catch (error) {
      const notification = document.createElement('div');
      notification.className =
        'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
      notification.textContent = `Error saving changes: ${error instanceof Error ? error.message : 'Unknown error'}`;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  const renderFields = () => {
    const commonFields: FieldConfig[] = [
      {
        name: sector === 'storage' ? 'project_name' : 'name',
        label: 'Project Name',
        type: 'text',
        placeholder: 'Enter project name',
      },
      {
        name: sector === 'ccus' ? 'project_status' : 'status',
        label: 'Status',
        type: 'text',
        placeholder: 'e.g. Concept, Operational, DEMO',
      },
      {
        name: sector === 'ccus' ? 'operation_date' : 'date_online',
        label: 'Start Date',
        type: 'text',
        placeholder: 'YYYY-MM-DD',
      },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
    ];

    const sectorFields: FieldConfig[] =
      sector === 'production'
        ? [
            { name: 'capacity_value', label: 'Capacity (MW)', type: 'number', placeholder: 'Enter capacity' },
            { name: 'technology', label: 'Technology', type: 'text', placeholder: 'Production technology' },
            { name: 'end_use', label: 'End Use', type: 'text', placeholder: 'e.g. Power, CH4 grid injection' },
            { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Comma-separated stakeholders' },
          ]
        : sector === 'storage'
        ? [
            {
              name: 'storage_mass_kt_per_year_value',
              label: 'Storage Capacity (kt/year)',
              type: 'number',
              placeholder: 'Enter storage capacity',
            },
            {
              name: 'storage_mass_kt_per_year_unit',
              label: 'Storage Capacity Unit',
              type: 'text',
              placeholder: 'e.g. kt/year',
            },
            { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Comma-separated stakeholders' },
          ]
        : sector === 'ccus'
        ? [
            { name: 'capacity_value', label: 'Capacity', type: 'number', placeholder: 'Enter capacity' },
            { name: 'technology_fate', label: 'Technology Fate', type: 'text', placeholder: 'Technology fate' },
            { name: 'end_use_sector', label: 'End Use Sector', type: 'text', placeholder: 'Comma-separated sectors' },
            { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Enter stakeholders' },
          ]
        : [];

    const fields = [...commonFields, ...sectorFields];

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
                (field.name === 'end_use' && sector === 'production') ||
                (field.name === 'stakeholders' && sector !== 'ccus') ||
                (field.name === 'end_use_sector' && sector === 'ccus')
                  ? (formData[field.name as keyof typeof formData] as string[] | null)?.join(', ') ?? ''
                  : String(formData[field.name as keyof typeof formData] ?? '')
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
              {(sector === 'storage' ? formData.project_name : formData.project_name) || 'Feature Details'}
            </h2>
            <p className="text-gray-500 capitalize text-sm sm:text-base">
              {formData.type
                ? `${formData.type} Project`
                : 'Unknown Project Type'}
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

export default PlantForm;