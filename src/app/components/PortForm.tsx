'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortItem } from '@/lib/types2';
import { STATUS_OPTIONS, StatusType, PORT_PROJECT_TYPES_OPTIONS, PortProjectTypeType, PORT_PRODUCT_OPTIONS, PortProductType, PORT_TECHNOLOGY_OPTIONS, PortTechnologyType } from '@/lib/lookupTables';

// --- TYPE DEFINITIONS ---

type PortFormData = Omit<Partial<PortItem>, 'capacity_value' | 'storage_capacity_value' | 'stakeholders'> & {
  stakeholders?: string;
  contact_name?: string;
  website_url?: string;
  project_type?: string;
  product_type?: string;
  technology_type?: string;
  capacity_value: string;
  storage_capacity_value: string;
  investmentString?: string;
};

interface FieldConfig {
  name: keyof PortFormData;
  label: string;
  type: string;
  placeholder?: string;
  disabled?: boolean;
  options?: ReadonlyArray<string>;
}

type SectionTitle = 'General Information' | 'Location' | 'Contact Information' | 'Project Details' | 'Capacity & Investment';

interface SectionConfig {
  title: SectionTitle;
  fields: (keyof PortFormData)[];
}

interface PortFormProps {
  initialFeature: PortItem & { [key: string]: any } | null;
  initialError: string | null;
  statusOptions: typeof STATUS_OPTIONS;
  statusTooltip: React.ReactElement;
  projectTypeOptions: typeof PORT_PROJECT_TYPES_OPTIONS;
  productTypeOptions: typeof PORT_PRODUCT_OPTIONS;
  technologyTypeOptions: typeof PORT_TECHNOLOGY_OPTIONS; // Added technologyTypeOptions
}

const prepareDataForSave = (formData: PortFormData, originalData: PortFormProps['initialFeature']) => {
  const dataToSave = JSON.parse(JSON.stringify(originalData || {}));
  const fieldsToDelete = [
    'id', 'name', 'type', 'latitude', 'longitude', 'internal_id', 'investmentString',
    'investment', 'capacity_value', 'capacity_unit', 'storage_capacity_value',
    'storage_capacity_unit', 'status_dates', 'line_number', 'ref_id'
  ];
  fieldsToDelete.forEach(field => delete dataToSave[field]);

  dataToSave.project_name = formData.project_name || null;
  dataToSave.project_type = formData.project_type || null;
  dataToSave.port_code = formData.port_code || null;
  dataToSave.partners = formData.partners || null;
  dataToSave.stakeholders = formData.stakeholders || null;
  dataToSave.contact_name = formData.contact_name || null;
  dataToSave.email = formData.email || null;
  dataToSave.country = formData.country || null;
  dataToSave.zip = formData.zip || null;
  dataToSave.city = formData.city || null;
  dataToSave.street = formData.street || null;
  dataToSave.website_url = formData.website_url || null;
  dataToSave.product_type = formData.product_type || null;
  dataToSave.technology_type = formData.technology_type || null;
  dataToSave.trade_type = formData.trade_type || null;

  if (!dataToSave.status_dates) dataToSave.status_dates = {};
  dataToSave.status_dates.status = formData.status || null;

  if (!dataToSave.coordinates) dataToSave.coordinates = {};
  dataToSave.coordinates.latitude = Number(formData.latitude || 0);
  dataToSave.coordinates.longitude = Number(formData.longitude || 0);

  const investmentValue = parseFloat(String(formData.investmentString)?.replace(/MUSD/i, '').trim() || '0');
  dataToSave.investment_capex = isNaN(investmentValue) ? null : investmentValue;

  const capacityVal = parseFloat(formData.capacity_value || '');
  dataToSave.capacity = { value: isNaN(capacityVal) ? null : capacityVal, unit: formData.capacity_unit || null };

  const storageVal = parseFloat(formData.storage_capacity_value || '');
  dataToSave.storage_capacity_tonnes = { value: isNaN(storageVal) ? null : storageVal, unit: formData.storage_capacity_unit || null };

  return dataToSave;
};

const PortForm = ({ initialFeature, initialError, statusOptions, statusTooltip, projectTypeOptions, productTypeOptions, technologyTypeOptions }: PortFormProps) => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionTitle, boolean>>({
    'General Information': true,
    'Location': true,
    'Contact Information': true,
    'Project Details': true,
    'Capacity & Investment': true,
  });

  const getInitialFormData = (feature: PortFormProps['initialFeature']): PortFormData => {
    const investmentCosts = feature?.investment;
    return {
      id: feature?.id ?? undefined,
      internal_id: feature?.internal_id ?? id ?? '',
      name: feature?.name ?? 'Placeholder Port',
      project_name: feature?.project_name ?? '',
      project_type: feature?.project_type ?? '',
      type: 'port',
      port_code: feature?.port_code ?? '',
      partners: feature?.partners ?? '',
      stakeholders: feature?.stakeholders ?? '',
      contact_name: feature?.contact_name ?? '',
      email: feature?.email ?? '',
      country: feature?.country ?? '',
      zip: feature?.zip ?? '',
      city: feature?.city ?? '',
      street: feature?.street ?? '',
      website_url: feature?.website_url ?? '',
      status: feature?.status ?? '',
      product_type: feature?.product_type ?? '',
      technology_type: feature?.technology_type ?? '',
      trade_type: feature?.trade_type ?? '',
      capacity_value: String(feature?.capacity_value ?? ''),
      capacity_unit: feature?.capacity_unit ?? '',
      storage_capacity_value: String(feature?.storage_capacity_value ?? ''),
      storage_capacity_unit: feature?.storage_capacity_unit ?? '',
      investmentString: investmentCosts ? `${investmentCosts} MUSD` : '',
      latitude: feature?.latitude ?? 0,
      longitude: feature?.longitude ?? 0,
    };
  };

  const [formData, setFormData] = useState(() => getInitialFormData(initialFeature));

  useEffect(() => {
    if (initialFeature) {
      console.log('Database status:', initialFeature.status);
      console.log('Status options:', statusOptions);
      console.log('Database project_type:', initialFeature.project_type);
      console.log('Project type options:', projectTypeOptions);
      console.log('Database product_type:', initialFeature.product_type);
      console.log('Product type options:', productTypeOptions);
      console.log('Database technology_type:', initialFeature.technology_type);
      console.log('Technology type options:', technologyTypeOptions);
    }
  }, [initialFeature, statusOptions, projectTypeOptions, productTypeOptions, technologyTypeOptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.internal_id) {
      alert('Error: Missing internal_id. Cannot save changes.');
      return;
    }

    try {
      const deleteResponse = await fetch('/api/delete-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_id: formData.internal_id }),
      });
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error(`Failed to deactivate the old project version. Code: ${deleteResponse.status}`);
      }
    } catch (error) {
      console.error('Error during deactivation step:', error);
      alert(`An error occurred while updating the project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }

    const dataToSave = prepareDataForSave(formData, initialFeature);

    try {
      const createResponse = await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_id: formData.internal_id,
          data: dataToSave,
        }),
      });
      if (!createResponse.ok) {
        const errorBody = await createResponse.json();
        throw new Error(`Failed to save new port data: ${errorBody.error || createResponse.statusText}`);
      }

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out';
      notification.textContent = 'Changes saved successfully!';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
      }, 3000);

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving new port data:', error);
      alert(`An error occurred while saving the project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleSection = (sectionTitle: SectionTitle) => {
    setOpenSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const renderFields = () => {
    const fields: FieldConfig[] = [
      { name: 'project_name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
      { name: 'project_type', label: 'Project Type', type: 'select', options: projectTypeOptions },
      { name: 'port_code', label: 'Port Code', type: 'text', placeholder: 'Alphanumeric, 5 characters' },
      { name: 'partners', label: 'Owner (Partners)', type: 'text', placeholder: 'Enter partners' },
      { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Enter stakeholders' },
      { name: 'contact_name', label: 'Name (Contact)', type: 'text', placeholder: 'Enter contact name' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      { name: 'zip', label: 'ZIP', type: 'text', placeholder: 'Enter zip code' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'street', label: 'Street', type: 'text', placeholder: 'Enter street' },
      { name: 'website_url', label: 'Website', type: 'text', placeholder: 'Enter website URL' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
      { name: 'product_type', label: 'Product Type', type: 'select', options: productTypeOptions },
      { name: 'technology_type', label: 'Technology Type', type: 'select', options: technologyTypeOptions }, // Changed to select
      { name: 'trade_type', label: 'Trade Type', type: 'text', placeholder: 'e.g. Import' },
      { name: 'capacity_value', label: 'Capacity Value', type: 'text', placeholder: 'e.g., 5.5' },
      { name: 'capacity_unit', label: 'Capacity Unit', type: 'text', placeholder: 'e.g., Mtpa' },
      { name: 'storage_capacity_value', label: 'Storage Capacity Value', type: 'text', placeholder: 'e.g., 2.1' },
      { name: 'storage_capacity_unit', label: 'Storage Capacity Unit', type: 'text', placeholder: 'e.g., Tonnes' },
      { name: 'investmentString', label: 'Investment (CAPEX)', type: 'text', placeholder: 'e.g. 500 MUSD' },
    ];

    const sections: SectionConfig[] = [
      { title: 'General Information', fields: ['project_name', 'project_type', 'port_code', 'partners', 'stakeholders'] },
      { title: 'Location', fields: ['country', 'city', 'street', 'zip'] },
      { title: 'Contact Information', fields: ['contact_name', 'email', 'website_url'] },
      { title: 'Project Details', fields: ['status', 'product_type', 'technology_type', 'trade_type'] },
      { title: 'Capacity & Investment', fields: ['capacity_value', 'capacity_unit', 'storage_capacity_value', 'storage_capacity_unit', 'investmentString'] },
    ];

    return (
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.title} className="border border-gray-200 rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 text-gray-800 font-semibold rounded-t-lg hover:bg-gray-100"
            >
              <span>{section.title}</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${openSections[section.title] ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections[section.title] && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.fields
                  .map(name => fields.find(field => field.name === name))
                  .filter((field): field is FieldConfig => !!field)
                  .map(field => (
                    <div key={field.name} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        {field.label}
                        {field.name === 'status' && statusTooltip}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name as keyof PortFormData] ?? ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'} text-black`}
                        >
                          <option value="">Select {field.label.toLowerCase()}</option>
                          {field.name === 'status' && initialFeature?.status && !statusOptions.includes(initialFeature.status as StatusType) && (
                            <option value={initialFeature.status}>{initialFeature.status}</option>
                          )}
                          {field.name === 'project_type' && initialFeature?.project_type && !projectTypeOptions.includes(initialFeature.project_type as PortProjectTypeType) && (
                            <option value={initialFeature.project_type}>{initialFeature.project_type}</option>
                          )}
                          {field.name === 'product_type' && initialFeature?.product_type && !productTypeOptions.includes(initialFeature.product_type as PortProductType) && (
                            <option value={initialFeature.product_type}>{initialFeature.product_type}</option>
                          )}
                          {field.name === 'technology_type' && initialFeature?.technology_type && !technologyTypeOptions.includes(initialFeature.technology_type as PortTechnologyType) && (
                            <option value={initialFeature.technology_type}>{initialFeature.technology_type}</option>
                          )}
                          {field.options?.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={String(formData[field.name as keyof PortFormData] ?? '')}
                          onChange={handleInputChange}
                          disabled={!isEditing || field.disabled}
                          placeholder={field.placeholder}
                          className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing && !field.disabled ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'} text-black`}
                        />
                      )}
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
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{initialError}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Back to Map
              </button>
              <button
                onClick={() => router.push('/port-list')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
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
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">{formData.name || 'Port Details'}</h2>
            <p className="text-gray-500 text-sm sm:text-base">Port Project</p>
          </div>
          <button
            type="button"
            onClick={() => isEditing ? (document.getElementById('port-form') as HTMLFormElement)?.requestSubmit() : setIsEditing(true)}
            className={`px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isEditing ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              )}
            </svg>
            {isEditing ? 'Save Changes' : 'Edit'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-700 text-sm">
              {isEditing ? 'You are now editing this port. Make your changes and click Save Changes when done.' : 'Viewing port details. Click Edit to make changes.'}
            </p>
          </div>
        </div>

        <form id="port-form" onSubmit={handleSubmit}>
          {renderFields()}
          <div className="flex flex-col sm:flex-row justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Back to Map
              </button>
              <button
                type="button"
                onClick={() => router.push('/port-list')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Port List
              </button>
            </div>
            {isEditing && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(getInitialFormData(initialFeature));
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