'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortItem } from '@/lib/types2';

interface FieldConfig {
  name: keyof PortItem | 'announcedSizeString' | 'investmentString' | 'status_dates.status' | 'status_dates.date_online' | 'status_dates.repurposed_new' | 'status_dates.decommission_date' | 'status_dates.announced_start_date';
  label: string;
  type: string;
  placeholder: string;
  disabled?: boolean;
  isCombined?: boolean;
}

interface SectionConfig {
  title: string;
  fields: (keyof PortItem | 'announcedSizeString' | 'investmentString' | 'status_dates.status' | 'status_dates.date_online' | 'status_dates.repurposed_new' | 'status_dates.decommission_date' | 'status_dates.announced_start_date')[];
}

interface PortFormProps {
  initialFeature: PortItem | null;
  initialError: string | null;
}

const PortForm = ({ initialFeature, initialError }: PortFormProps) => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'General Information': true,
    'Location': true,
    'Project Details': true,
    'Capacity': true,
    'Investment': true,
    'Additional Information': true,
  });

  const initialFormData: Partial<PortItem> & {
    announcedSizeString?: string;
    investmentString?: string;
  } = {
    id: initialFeature?.id ?? '',
    internal_id: initialFeature?.internal_id ?? id ?? '',
    name: initialFeature?.name ?? 'Placeholder Port',
    type: initialFeature?.type ?? 'port',
    status: initialFeature?.status ?? '',
    project_name: initialFeature?.project_name ?? '',
    city: initialFeature?.city ?? '',
    country: initialFeature?.country ?? '',
    trade_type: initialFeature?.trade_type ?? '',
    partners: initialFeature?.partners ?? '',
    investment: initialFeature?.investment ?? null,
    investmentString: initialFeature?.investment?.costs_musd
      ? `${initialFeature.investment.costs_musd} MUSD`
      : '',
    product_type: initialFeature?.product_type ?? '',
    data_source: initialFeature?.data_source ?? '',
    technology_type: initialFeature?.technology_type ?? '',
    announced_size: initialFeature?.announced_size ?? null,
    announcedSizeString: initialFeature?.announced_size?.value && initialFeature?.announced_size?.unit
      ? `${initialFeature.announced_size.value} ${initialFeature.announced_size.unit}`
      : '',
    references: initialFeature?.references ?? null,
    ref_id: initialFeature?.ref_id ?? '',
    status_dates: initialFeature?.status_dates ?? {
      status: '',
      date_online: '',
      repurposed_new: '',
      decommission_date: '',
      announced_start_date: '',
    },
    latitude: initialFeature?.latitude ?? 0,
    longitude: initialFeature?.longitude ?? 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'announcedSizeString') {
      const [parsedValue, ...unitParts] = value.trim().split(' ');
      const parsedUnit = unitParts.join(' ');
      const parsedNumber = parseFloat(parsedValue) || 0;
      setFormData((prev) => ({
        ...prev,
        announcedSizeString: value,
        announced_size: {
          unit: parsedUnit || prev.announced_size?.unit || null,
          value: parsedNumber,
          vessels: prev.announced_size?.vessels ?? null,
          capacity_per_vessel: prev.announced_size?.capacity_per_vessel ?? null,
          original_text: value || null,
        },
      }));
    } else if (name === 'investmentString') {
      const [parsedValue, ...unitParts] = value.trim().split(' ');
      const parsedUnit = unitParts.join(' ');
      const parsedNumber = parseFloat(parsedValue) || 0;
      setFormData((prev) => ({
        ...prev,
        investmentString: value,
        investment: {
          costs_musd: parsedUnit === 'MUSD' ? parsedNumber.toString() : value || null,
        },
      }));
    } else if (name.startsWith('status_dates.')) {
      const key = name.split('.')[1] as keyof NonNullable<PortItem['status_dates']>;
      setFormData((prev) => ({
        ...prev,
        status_dates: {
          ...(prev.status_dates ?? {
            status: '',
            date_online: '',
            repurposed_new: '',
            decommission_date: '',
            announced_start_date: '',
          }),
          [key]: value,
        },
      }));
    } else if (name === 'references') {
      const refArray = value.split(',').map((v) => v.trim()).filter(Boolean);
      const refObject = refArray.reduce((acc, ref, i) => {
        acc[`ref${i + 1}`] = ref || null;
        return acc;
      }, {} as { [key: string]: string | null });
      setFormData((prev) => ({ ...prev, references: refArray.length ? refObject : null }));
    } else {
      const parsedValue =
        ['latitude', 'longitude'].includes(name)
          ? parseFloat(value) || 0
          : value;
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);

    // Map formData to project_map.data JSONB structure
    const dataPayload = {
      ref: formData.ref_id || null,
      country: formData.country || null,
      capacity: {
        capacity_kt_y: { unit: null, value: null },
        capacity_mwel: { unit: null, value: null },
        announced_size: formData.announced_size || { unit: null, value: null, vessels: null, capacity_per_vessel: null, original_text: null },
        capacity_nm3_h: { unit: null, value: null },
      },
      location: formData.city || null,
      partners: formData.partners || null,
      investment: formData.investment || { costs_musd: null },
      references: formData.references || null,
      trade_type: formData.trade_type || null,
      coordinates: {
        latitude: String(formData.latitude || 0),
        longitude: String(formData.longitude || 0),
        geocoding_status: formData.latitude && formData.longitude ? 'OK' : null,
      },
      data_source: formData.data_source || null,
      line_number: formData.line_number || null,
      product_type: formData.product_type || null,
      project_name: formData.project_name || null,
      status_dates: formData.status_dates || {
        status: null,
        date_online: null,
        repurposed_new: null,
        decommission_date: null,
        announced_start_date: null,
      },
      technology_type: formData.technology_type || null,
    };

    try {
      const response = await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_id: formData.internal_id,
          data: dataPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save port data: ${response.statusText}`);
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

      // Reset form to initial state or redirect as needed
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving port data:', error);
      const notification = document.createElement('div');
      notification.className =
        'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
      notification.textContent = 'Failed to save changes. Please try again.';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const renderFields = () => {
    const fields: FieldConfig[] = [
      { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter port name' },
      { name: 'project_name', label: 'Project Name (Detailed)', type: 'text', placeholder: 'Enter detailed project name' },
      { name: 'partners', label: 'Partners', type: 'text', placeholder: 'Enter partners' },
      { name: 'product_type', label: 'Product Type', type: 'text', placeholder: 'Enter product type' },
      { name: 'trade_type', label: 'Trade Type', type: 'text', placeholder: 'e.g. Import, Export' },
      { name: 'technology_type', label: 'Technology Type', type: 'text', placeholder: 'Enter technology type' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Concept, Operational' },
      { name: 'status_dates.status', label: 'Current Status', type: 'text', placeholder: 'Enter current status' },
      { name: 'status_dates.date_online', label: 'Date Online', type: 'text', placeholder: 'Enter date online' },
      { name: 'status_dates.repurposed_new', label: 'Repurposed/New', type: 'text', placeholder: 'Enter repurposed or new' },
      { name: 'status_dates.decommission_date', label: 'Decommission Date', type: 'text', placeholder: 'Enter decommission date' },
      { name: 'status_dates.announced_start_date', label: 'Announced Start Date', type: 'text', placeholder: 'Enter announced start date' },
      { name: 'announcedSizeString', label: 'Announced Size', type: 'text', placeholder: 'e.g. 100 kt/y', isCombined: true },
      { name: 'investmentString', label: 'Investment', type: 'text', placeholder: 'e.g. 500 MUSD', isCombined: true },
      { name: 'data_source', label: 'Data Source', type: 'text', placeholder: 'Enter data source' },
      { name: 'references', label: 'References', type: 'text', placeholder: 'Comma-separated references' },
      { name: 'ref_id', label: 'Reference ID', type: 'text', placeholder: 'Enter reference ID' },
      { name: 'type', label: 'Type', type: 'text', placeholder: 'Port', disabled: true },
    ];

    const sections: SectionConfig[] = [
      {
        title: 'General Information',
        fields: ['name', 'project_name', 'partners', 'product_type', 'trade_type', 'technology_type'],
      },
      {
        title: 'Location',
        fields: ['country', 'city'],
      },
      {
        title: 'Project Details',
        fields: [
          'status',
          'status_dates.status',
          'status_dates.date_online',
          'status_dates.repurposed_new',
          'status_dates.decommission_date',
          'status_dates.announced_start_date',
        ],
      },
      {
        title: 'Capacity',
        fields: ['announcedSizeString'],
      },
      {
        title: 'Investment',
        fields: ['investmentString'],
      },
      {
        title: 'Additional Information',
        fields: ['data_source', 'references', 'ref_id'],
      },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="border border-gray-200 rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 text-gray-800 font-semibold rounded-t-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <span>{section.title}</span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${openSections[section.title] ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections[section.title] && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-200">
                {section.fields
                  .map((name) => fields.find((field) => field.name === name))
                  .filter((field): field is FieldConfig => !!field)
                  .map((field) => (
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
                          field.name === 'references'
                            ? formData.references
                              ? Object.values(formData.references).filter((v): v is string => v !== null).join(', ')
                              : ''
                            : field.name === 'announcedSizeString'
                            ? formData.announcedSizeString ?? ''
                            : field.name === 'investmentString'
                            ? formData.investmentString ?? ''
                            : field.name.startsWith('status_dates.')
                            ? formData.status_dates?.[field.name.split('.')[1] as keyof NonNullable<PortItem['status_dates']>] ?? ''
                            : String(formData[field.name as keyof PortItem] ?? '')
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
            )}
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
            <p className="text-gray-500 text-sm sm:text-base">
              {formData.type ? 'Port Project' : 'Unknown Project Type'}
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