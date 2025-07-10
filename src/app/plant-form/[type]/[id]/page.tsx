import PlantForm from '@/app/components/PlantForm';
import { getPlantFeature } from '@/services/getPlantFeature';
import { logger } from '@/lib/logger';
import { Feature as LeafletFeature } from '@/app/components/LeafletMap';
import { Feature as PlantFormFeature } from '@/app/components/PlantForm';

interface PlantFormPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function PlantFormPage({ params }: PlantFormPageProps) {
  const { type, id } = await params;
  logger.info('PlantFormPage params', { type, id });

  const { feature: initialLeafletFeature, error: initialError } = await getPlantFeature(id, type);

  logger.info('PlantFormPage fetched feature', { initialLeafletFeature, initialError });

  // Convert LeafletFeature to PlantFormFeature if geometry.type is 'Point'
  let initialFeature: PlantFormFeature | null = null;
  if (initialLeafletFeature?.geometry.type === 'Point') {
    initialFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: initialLeafletFeature.geometry.coordinates as [number, number],
      },
      properties: {
        id: initialLeafletFeature.properties.id,
        internal_id: initialLeafletFeature.properties.internal_id,
        name: initialLeafletFeature.properties.name,
        status: initialLeafletFeature.properties.status,
        type: initialLeafletFeature.properties.type,
        capacity_mw: initialLeafletFeature.properties.capacity_mw,
        end_use: initialLeafletFeature.properties.end_use,
        consumption_tpy: initialLeafletFeature.properties.consumption_tpy,
        start_year: initialLeafletFeature.properties.start_year,
        city: initialLeafletFeature.properties.city,
        country: initialLeafletFeature.properties.country,
        process: initialLeafletFeature.properties.process,
      },
    };
  }

  logger.info('PlantFormPage props passed to PlantForm', { initialFeature, initialError });

  return <PlantForm initialFeature={initialFeature} initialError={initialError} />;
}