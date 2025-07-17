'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CCUSItem, CCUSReference } from '@/lib/types2';
import { STATUS_OPTIONS, StatusType, CCUS_PROJECT_TYPES_OPTIONS, CCUSProjectTypeType, CCUS_END_USE_OPTIONS, CCUSEndUseType, CCUS_TECHNOLOGY_OPTIONS, CCUSTechnologyType } from '@/lib/lookupTables';

// --- TYPE DEFINITIONS ---

interface FieldConfig {
  name: keyof CCUSItem | 'capacity';
  label: string;
  type: string;
  placeholder?: string;
  isCombined?: boolean;
  options?: ReadonlyArray<string>;
}

type SectionTitle = 'General Information' | 'Location' | 'Project Details' | 'Capacity' | 'Contact Information';

interface SectionConfig {
  title: SectionTitle;
  fields: (keyof CCUSItem | 'capacity')[];
}

interface CCUSFormProps {
  initialFeature: CCUSItem | null;
  initialError: string | null;
  statusOptions: typeof STATUS_OPTIONS;
  statusTooltip: React.ReactElement;
  projectTypeOptions: typeof CCUS_PROJECT_TYPES_OPTIONS;
  endUseSectorOptions: typeof CCUS_END_USE_OPTIONS;
  technologyTypeOptions: typeof CCUS_TECHNOLOGY_OPTIONS; // Added technologyTypeOptions
}

const CCUSForm = ({ initialFeature, initialError, statusOptions, statusTooltip, projectTypeOptions, endUseSectorOptions, technologyTypeOptions }: CCUSFormProps) => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionTitle, boolean>>({
    'General Information': true,
    'Location': true,
    'Project Details': true,
    'Capacity': true,
    'Contact Information': true,
  });

  const initialFormData: Partial<CCUSItem> & { capacity?: string } = {
    id: initialFeature?.id ?? '',
    internal_id: initialFeature?.internal_id ?? id ?? '',
    name: initialFeature?.name ?? 'Placeholder Feature',
    type: initialFeature?.type ?? 'CCUS',
    project_name: initialFeature?.project_name ?? '',
    owner: initialFeature?.owner ?? '',
    stakeholders: initialFeature?.stakeholders ?? '',
    contact: initialFeature?.contact ?? '',
    email: initialFeature?.email ?? '',
    country: initialFeature?.country ?? '',
    zip: initialFeature?.zip ?? '',
    city: initialFeature?.city ?? '',
    street: initialFeature?.street ?? '',
    website: initialFeature?.website ?? '',
    project_status: initialFeature?.project_status ? String(initialFeature.project_status) : '',
    operation_date: initialFeature?.operation_date ?? '',
    project_type: initialFeature?.project_type ?? '',
    product: initialFeature?.product ?? '',
    technology_fate: initialFeature?.technology_fate ?? '',
    end_use_sector: initialFeature?.end_use_sector ?? '',
    capacity_unit: initialFeature?.capacity_unit ?? '',
    capacity_value: initialFeature?.capacity_value ?? 0,
    capacity: initialFeature?.capacity_value && initialFeature?.capacity_unit
      ? `${initialFeature.capacity_value} ${initialFeature.capacity_unit}`
      : '',
    investment_capex: initialFeature?.investment_capex ?? '',
    references: initialFeature?.references ?? [],
    latitude: initialFeature?.latitude ?? 0,
    longitude: initialFeature?.longitude ?? 0,
  };

  const [formData, setFormData] = useState<Partial<CCUSItem> & { capacity?: string }>(initialFormData);

  useEffect(() => {
    if (initialFeature) {
      console.log('Database project_status:', initialFeature.project_status);
      console.log('Status options:', statusOptions);
      console.log('Database project_type:', initialFeature.project_type);
      console.log('Project type options:', projectTypeOptions);
      console.log('Database end_use_sector:', initialFeature.end_use_sector);
      console.log('End use sector options:', endUseSectorOptions);
      console.log('Database technology_fate:', initialFeature.technology_fate);
      console.log('Technology type options:', technologyTypeOptions);
    }
  }, [initialFeature, statusOptions, projectTypeOptions, endUseSectorOptions, technologyTypeOptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'capacity') {
      const [parsedValue, ...unitParts] = value.trim().split(' ');
      const parsedUnit = unitParts.join(' ');
      const parsedNumber = parseFloat(parsedValue) || 0;
      setFormData((prev) => ({
        ...prev,
        capacity_value: parsedNumber,
        capacity_unit: parsedUnit || prev.capacity_unit || '',
        capacity: value,
      }));
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

    const dataPayload = {
      plant_name: formData.name || null,
      project_name: formData.project_name || null,
      owner: formData.owner || null,
      stakeholders: formData.stakeholders || null,
      contact_name: formData.contact || null,
      email: formData.email || null,
      country: formData.country || null,
      zip: formData.zip || null,
      city: formData.city || null,
      street: formData.street || null,
      website_url: formData.website || null,
      status_date: {
        project_status: formData.project_status || null,
        operation_date: formData.operation_date || null,
      },
      project_type: formData.project_type || null,
      product: formData.product || null,
      technology_fate: formData.technology_fate || null,
      end_use_sector: formData.end_use_sector || null,
      capacity: {
        unit: formData.capacity_unit || null,
        value: formData.capacity_value || null,
      },
      investment_capex: formData.investment_capex || null,
      references: formData.references?.length
        ? formData.references.map((r) => ({ ref: r.ref, link: r.link }))
        : null,
      coordinates: {
        latitude: String(formData.latitude || 0),
        longitude: String(formData.longitude || 0),
      },
    };

    try {
      const response = await fetch('/api/ccus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_id: formData.internal_id,
          data: dataPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save CCUS data: ${response.statusText}`);
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
      console.error('Error saving CCUS data:', error);
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

  const toggleSection = (sectionTitle: SectionTitle) => {
    setOpenSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const renderFields = () => {
    const fields: FieldConfig[] = [
      { name: 'name', label: 'Plant Name', type: 'text', placeholder: 'Enter plant name' },
      { name: 'project_name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
      { name: 'owner', label: 'Owner', type: 'text', placeholder: 'Enter owner' },
      { name: 'project_type', label: 'Project Type', type: 'select', options: projectTypeOptions },
      { name: 'product', label: 'Product', type: 'text', placeholder: 'Enter product' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'street', label: 'Street', type: 'text', placeholder: 'Enter street' },
      { name: 'zip', label: 'Zip Code', type: 'text', placeholder: 'Enter zip code' },
      { name: 'technology_fate', label: 'Technology (Fate of Carbon)', type: 'select', options: technologyTypeOptions }, // Changed to select
      { name: 'project_status', label: 'Status', type: 'select', options: statusOptions },
      { name: 'operation_date', label: 'Operation Date', type: 'text', placeholder: 'Enter operation date' },
      { name: 'capacity', label: 'Capacity', type: 'text', placeholder: 'e.g. 10 Mt CO2/yr', isCombined: true },
      { name: 'end_use_sector', label: 'End Use Sector', type: 'select', options: endUseSectorOptions },
      { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Comma-separated stakeholders' },
      { name: 'investment_capex', label: 'Investment (CAPEX)', type: 'text', placeholder: 'e.g. 100 USD' },
      { name: 'contact', label: 'Contact Name', type: 'text', placeholder: 'Enter contact name' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email' },
      { name: 'website', label: 'Website', type: 'text', placeholder: 'Enter website URL' },
    ];

    const sections: SectionConfig[] = [
      {
        title: 'General Information',
        fields: ['name', 'project_name', 'owner', 'project_type', 'product'],
      },
      {
        title: 'Location',
        fields: ['country', 'city', 'street', 'zip'],
      },
      {
        title: 'Project Details',
        fields: ['technology_fate', 'project_status', 'operation_date'],
      },
      {
        title: 'Capacity',
        fields: ['capacity', 'end_use_sector', 'investment_capex'],
      },
      {
        title: 'Contact Information',
        fields: ['stakeholders', 'contact', 'email', 'website'],
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
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        {field.label}
                        {field.name === 'project_status' && statusTooltip}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={
                            field.name === 'project_status'
                              ? formData.project_status ?? ''
                              : field.name === 'project_type'
                              ? formData.project_type ?? ''
                              : field.name === 'end_use_sector'
                              ? formData.end_use_sector ?? ''
                              : field.name === 'technology_fate'
                              ? formData.technology_fate ?? ''
                              : ''
                          }
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-black ${
                            isEditing ? 'bg-white hover:border-gray-400' : 'bg-gray-50 cursor-not-allowed'
                          }`}
                        >
                          <option value="">
                            {field.name === 'project_status'
                              ? 'Select a status'
                              : field.name === 'project_type'
                              ? 'Select a project type'
                              : field.name === 'end_use_sector'
                              ? 'Select an end use sector'
                              : field.name === 'technology_fate'
                              ? 'Select a technology (fate of carbon)'
                              : 'Select an option'}
                          </option>
                          {field.name === 'project_status' && initialFeature?.project_status && !statusOptions.includes(initialFeature.project_status as StatusType) && (
                            <option value={initialFeature.project_status}>{initialFeature.project_status}</option>
                          )}
                          {field.name === 'project_type' && initialFeature?.project_type && !projectTypeOptions.includes(initialFeature.project_type as CCUSProjectTypeType) && (
                            <option value={initialFeature.project_type}>{initialFeature.project_type}</option>
                          )}
                          {field.name === 'end_use_sector' && initialFeature?.end_use_sector && !endUseSectorOptions.includes(initialFeature.end_use_sector as CCUSEndUseType) && (
                            <option value={initialFeature.end_use_sector}>{initialFeature.end_use_sector}</option>
                          )}
                          {field.name === 'technology_fate' && initialFeature?.technology_fate && !technologyTypeOptions.includes(initialFeature.technology_fate as CCUSTechnologyType) && (
                            <option value={initialFeature.technology_fate}>{initialFeature.technology_fate}</option>
                          )}
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={
                            field.name === 'stakeholders'
                              ? formData.stakeholders ?? ''
                              : field.name === 'capacity'
                              ? formData.capacity ?? ''
                              : String(formData[field.name as keyof CCUSItem] ?? '')
                          }
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder={field.placeholder}
                          className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-black ${
                            isEditing ? 'bg-white hover:border-gray-400' : 'bg-gray-50 cursor-not-allowed'
                          }`}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{initialError}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => router.push('/')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Back to Map
              </button>
              <button onClick={() => router.push('/plant-list')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-18-8h18m-18 12h18"/>
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
              {formData.name || 'CCUS Feature Details'}
            </h2>
            <p className="text-gray-500 capitalize text-sm sm:text-base">
              CCUS Project
            </p>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <svg className={`w-5 h-5 mr-2 transition-transform duration-200 ${isEditing ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isEditing ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>)}
            </svg>
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
              <button type="button" onClick={() => router.push('/')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
                Back to Map
              </button>
              <button type="button" onClick={() => router.push('/plant-list?type=CCUS')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-18-8h18m-18 12h18"/>
                </svg>
                CCUS Plant List
              </button>
            </div>
            {isEditing && (
              <div className="flex gap-3">
                <button type="button" onClick={() => { setFormData(initialFormData); setIsEditing(false); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md">
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

export default CCUSForm;