import ProductionForm from '@/app/components/ProductionForm';
import StorageForm from '@/app/components/StorageForm';
import CCUSForm from '@/app/components/CCUSForm';
import { getPlantFeature } from '@/services/getPlantFeature';
import { logger } from '@/lib/logger';
import { ProductionItem, StorageItem, CCUSItem } from '@/lib/types2';

interface PlantFormPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function PlantFormPage({ params }: PlantFormPageProps) {
  const { type, id } = await params;
  logger.info('PlantFormPage params', { type, id });

  const { feature: initialLeafletFeature, error: initialError } = await getPlantFeature(id, type);

  logger.info('PlantFormPage fetched feature', { initialLeafletFeature, initialError });

  let initialFeature: ProductionItem | StorageItem | CCUSItem | null = null;
  if (initialLeafletFeature?.geometry.type === 'Point') {
    const { properties } = initialLeafletFeature;
    const sector = type.toLowerCase();

    if (sector === 'production' && 'primary_product' in properties) {
      initialFeature = {
        id: properties.id ?? '',
        internal_id: properties.internal_id ?? id,
        name: properties.project_name ?? 'Placeholder Feature', // Fixed: Use properties.name instead of properties.project_name
        type: properties.type ?? 'Production',
        status: properties.status ?? '',
        city: properties.city ?? '',
        country: properties.country ?? '',
        zip: properties.zip ?? '',
        email: properties.email ?? '',
        owner: properties.owner ?? '',
        date_online: properties.date_online ?? '',
        street: properties.street ?? '',
        website_url: properties.website_url ?? '',
        contact_name: properties.contact_name ?? '',
        project_name: properties.project_name ?? '',
        project_type: properties.project_type ?? '',
        primary_product: properties.primary_product ?? '',
        secondary_product: properties.secondary_product ?? '',
        technology: properties.technology ?? '',
        capacity_unit: properties.capacity_unit ?? '',
        capacity_value: properties.capacity_value ?? 0,
        end_use: properties.end_use ?? [],
        stakeholders: properties.stakeholders ?? [],
        investment_capex: properties.investment_capex ?? '',
        latitude: properties.latitude ?? 0,
        longitude: properties.longitude ?? 0,
      } as ProductionItem;
    } else if (sector === 'storage' && 'storage_mass_kt_per_year_unit' in properties) {
      initialFeature = {
        id: properties.id ?? '',
        internal_id: properties.internal_id ?? id,
        city: properties.city ?? '',
        country: properties.country ?? '',
        zip: properties.zip ?? '',
        email: properties.email ?? '',
        owner: properties.owner ?? '',
        date_online: properties.date_online ?? '',
        status: properties.status ?? '',
        street: properties.street ?? '',
        website_url: properties.website_url ?? '',
        contact_name: properties.contact_name ?? '',
        project_name: properties.project_name ?? '',
        project_type: properties.project_type ?? '',
        primary_product: properties.primary_product ?? '',
        stakeholders: properties.stakeholders ?? [],
        storage_mass_kt_per_year_unit: properties.storage_mass_kt_per_year_unit ?? '',
        storage_mass_kt_per_year_value: properties.storage_mass_kt_per_year_value ?? 0,
        latitude: properties.latitude ?? 0,
        longitude: properties.longitude ?? 0,
        type: properties.type ?? 'Storage',
      } as StorageItem;
    } else if (sector === 'ccus' && 'technology_fate' in properties) {
      initialFeature = {
        id: properties.id ?? '',
        internal_id: properties.internal_id ?? id,
        name: properties.name ?? 'Placeholder Feature',
        type: properties.type ?? 'CCUS',
        project_status: properties.project_status ?? '',
        city: properties.city ?? '',
        country: properties.country ?? '',
        street: properties.street ?? '',
        email: properties.email ?? '',
        owner: properties.owner ?? '',
        contact: properties.contact ?? '',
        website: properties.website ?? '',
        project_name: properties.project_name ?? '',
        project_type: properties.project_type ?? '',
        stakeholders: properties.stakeholders ?? [],
        product: properties.product ?? '',
        technology_fate: properties.technology_fate ?? '',
        end_use_sector: properties.end_use_sector ?? [],
        capacity_unit: properties.capacity_unit ?? '',
        capacity_value: properties.capacity_value ?? 0,
        investment_capex: properties.investment_capex ?? '',
        operation_date: properties.operation_date ?? '',
        latitude: properties.latitude ?? 0,
        longitude: properties.longitude ?? 0,
      } as CCUSItem;
    }
  }

  logger.info('PlantFormPage props passed to form', { initialFeature, initialError });

  const sector = type.toLowerCase();
  if (sector === 'production') {
    return <ProductionForm initialFeature={initialFeature as ProductionItem | null} initialError={initialError} />;
  } else if (sector === 'storage') {
    return <StorageForm initialFeature={initialFeature as StorageItem | null} initialError={initialError} />;
  } else if (sector === 'ccus') {
    return <CCUSForm initialFeature={initialFeature as CCUSItem | null} initialError={initialError} />;
  }

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
            Invalid Project Type
          </h2>
          <p className="text-gray-600 mb-6">The specified project type is not recognized.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => window.location.href = '/'}
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
              onClick={() => window.location.href = '/plant-list'}
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