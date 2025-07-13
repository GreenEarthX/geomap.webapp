'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortItem } from '@/lib/types2';

// Define an extended interface for the form state to include new fields
type PortFormData = Partial<PortItem> & {
  port_code?: string;
  stakeholders?: string[];
  contact_name?: string;
  email?: string;
  zip?: string;
  street?: string;
  website_url?: string;
  end_use?: string[];
  capacity_total_volume?: string;
  capacity_storage_volume?: string;
  investmentString?: string;
};

interface FieldConfig {
  name: keyof PortFormData;
  label: string;
  type: string;
  placeholder: string;
  disabled?: boolean;
}

interface SectionConfig {
  title: string;
  fields: (keyof PortFormData)[];
}

interface PortFormProps {
  initialFeature: PortItem & { [key: string]: any } | null; // Allow extra properties from DB
  initialError: string | null;
}

// Reusable function to clean array data on load
const cleanArrayField = (fieldData: any): string[] => {
    if (!Array.isArray(fieldData)) return [];
    if (fieldData.length > 0 && Array.isArray(fieldData[0])) return fieldData.flat();
    if (fieldData.length === 1 && typeof fieldData[0] === 'string') {
        try {
            const parsed = JSON.parse(fieldData[0]);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) { /* Fall through */ }
    }
    return fieldData;
};


const PortForm = ({ initialFeature, initialError }: PortFormProps) => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'General Information': true,
    'Location': true,
    'Contact Information': true,
    'Project Details': true,
    'Capacity & Investment': true,
  });

  const initialFormData: PortFormData = {
    id: initialFeature?.id ?? '',
    internal_id: initialFeature?.internal_id ?? id ?? '',
    name: initialFeature?.name ?? 'Placeholder Port',
    project_name: initialFeature?.project_name ?? '',
    type: 'port',
    port_code: initialFeature?.port_code ?? '',
    partners: initialFeature?.partners ?? '',
    stakeholders: cleanArrayField(initialFeature?.stakeholders),
    contact_name: initialFeature?.contact_name ?? '',
    email: initialFeature?.email ?? '',
    country: initialFeature?.country ?? '',
    zip: initialFeature?.zip ?? '',
    city: initialFeature?.city ?? '',
    street: initialFeature?.street ?? '',
    website_url: initialFeature?.website_url ?? '',
    status: initialFeature?.status ?? '',
    status_dates: initialFeature?.status_dates ?? { status: '', date_online: '', repurposed_new: '', decommission_date: '', announced_start_date: '' },
    product_type: initialFeature?.product_type ?? '',
    end_use: cleanArrayField(initialFeature?.end_use),
    capacity_total_volume: initialFeature?.capacity_total_volume ?? '',
    capacity_storage_volume: initialFeature?.capacity_storage_volume ?? '',
    investment: initialFeature?.investment ?? null,
    investmentString: initialFeature?.investment?.costs_musd ? `${initialFeature.investment.costs_musd} MUSD` : '',
    latitude: initialFeature?.latitude ?? 0,
    longitude: initialFeature?.longitude ?? 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const arrayFields = ['stakeholders', 'end_use'];

    if (arrayFields.includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value.split(',').map((v) => v.trim()).filter(Boolean),
      }));
    } else if (name === 'investmentString') {
      setFormData((prev) => ({
        ...prev,
        investmentString: value,
        investment: { costs_musd: value.replace(/MUSD/i, '').trim() || null },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
            throw new Error('Failed to deactivate the old project version.');
        }

    } catch (error) {
        console.error('Error during deactivation step:', error);
        alert('An error occurred while updating the project. Please try again.');
        return;
    }

    const dataPayload = {
      project_name: formData.project_name || null,
      port_code: formData.port_code || null,
      owner_partner: formData.partners || null,
      stakeholders: formData.stakeholders?.length ? formData.stakeholders : null,
      name_contact: formData.contact_name || null,
      email: formData.email || null,
      country: formData.country || null,
      zip: formData.zip || null,
      city: formData.city || null,
      street: formData.street || null,
      website: formData.website_url || null,
      status_date: formData.status || null,
      products: formData.product_type || null,
      end_use: formData.end_use?.length ? formData.end_use : null,
      capacity_total_volume: formData.capacity_total_volume || null,
      capacity_storage_volume: formData.capacity_storage_volume || null,
      investment_capex: formData.investment?.costs_musd || null,
      coordinates: { latitude: String(formData.latitude || 0), longitude: String(formData.longitude || 0) },
      type: 'port',
    };

    try {
      const createResponse = await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_id: formData.internal_id,
          data: dataPayload,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to save new port data: ${createResponse.statusText}`);
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

    } catch (error) {
      console.error('Error saving new port data:', error);
      alert('An error occurred while saving the new project data. Please try again.');
    }
  };

  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const renderFields = () => {
    const fields: FieldConfig[] = [
      { name: 'project_name', label: 'Project Name', type: 'text', placeholder: 'Enter project name' },
      { name: 'port_code', label: 'Port Code', type: 'text', placeholder: 'Alphanumeric, 5 characters' },
      { name: 'partners', label: 'Owner (Partners)', type: 'text', placeholder: 'Enter partners' },
      { name: 'stakeholders', label: 'Stakeholders', type: 'text', placeholder: 'Comma-separated stakeholders' },
      { name: 'contact_name', label: 'Name (Contact)', type: 'text', placeholder: 'Enter contact name' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Country location' },
      { name: 'zip', label: 'ZIP', type: 'text', placeholder: 'Enter zip code' },
      { name: 'city', label: 'City', type: 'text', placeholder: 'City location' },
      { name: 'street', label: 'Street', type: 'text', placeholder: 'Enter street' },
      { name: 'website_url', label: 'Website', type: 'text', placeholder: 'Enter website URL' },
      { name: 'status', label: 'Status / Date', type: 'text', placeholder: 'e.g. Operational (2025)' },
      { name: 'product_type', label: 'Products', type: 'text', placeholder: 'Enter products' },
      { name: 'end_use', label: 'End Use', type: 'text', placeholder: 'Comma-separated end uses' },
      { name: 'capacity_total_volume', label: 'Capacity: Total Volume', type: 'text', placeholder: 'Million tons per year' },
      { name: 'capacity_storage_volume', label: 'Capacity: Storage Volume', type: 'text', placeholder: 'Million tons per year' },
      { name: 'investmentString', label: 'Investment (CAPEX)', type: 'text', placeholder: 'e.g. 500 MUSD' },
    ];

    const sections: SectionConfig[] = [
      { title: 'General Information', fields: ['project_name', 'port_code', 'partners', 'stakeholders'] },
      { title: 'Location', fields: ['country', 'city', 'street', 'zip'] },
      { title: 'Contact Information', fields: ['contact_name', 'email', 'website_url'] },
      { title: 'Project Details', fields: ['status', 'product_type', 'end_use'] },
      { title: 'Capacity & Investment', fields: ['capacity_total_volume', 'capacity_storage_volume', 'investmentString'] },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="border border-gray-200 rounded-lg shadow-sm">
            <button type="button" onClick={() => toggleSection(section.title)} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 text-gray-800 font-semibold rounded-t-lg hover:bg-gray-100">
              <span>{section.title}</span>
              <svg className={`w-5 h-5 transform transition-transform ${openSections[section.title] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections[section.title] && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.fields
                  .map((name) => fields.find((field) => field.name === name))
                  .filter((field): field is FieldConfig => !!field)
                  .map((field) => (
                    <div key={field.name} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={
                            (Array.isArray(formData[field.name as keyof PortFormData]))
                                ? (formData[field.name as keyof PortFormData] as string[]).join(', ')
                                : String(formData[field.name as keyof PortFormData] ?? '')
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing || field.disabled}
                        placeholder={field.placeholder}
                        className={`w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing && !field.disabled ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'} text-black`}
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
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{initialError}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => router.push('/')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                </svg>
                Back to Map
              </button>
              <button onClick={() => router.push('/port-list')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-18-8h18m-18 12h18" />
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
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">{formData.name || 'Port Details'}</h2>
            <p className="text-gray-500 text-sm sm:text-base">Port Project</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
                if (isEditing) {
                    // If we are already editing, this button click should trigger the form submission.
                    // We can do this by finding the form and calling requestSubmit().
                    (document.getElementById('port-form') as HTMLFormElement)?.requestSubmit();
                } else {
                    // If not editing, just enable the editing mode.
                    setIsEditing(true);
                }
            }}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            <svg className={`w-5 h-5 mr-2 transition-transform duration-200 ${isEditing ? 'rotate-0' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              {isEditing
                ? 'You are now editing this port. Make your changes and click Save Changes when done.'
                : 'Viewing port details. Click Edit to make changes.'}
            </p>
          </div>
        </div>

        <form id="port-form" onSubmit={handleSubmit}>
          {renderFields()}
          <div className="flex flex-col sm:flex-row justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => router.push('/')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                </svg>
                Back to Map
              </button>
              <button type="button" onClick={() => router.push('/port-list')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-18-8h18m-18 12h18" />
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