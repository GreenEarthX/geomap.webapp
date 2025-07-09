import PlantForm from '@/app/components/PlantForm';
import { getPlantFeature } from '@/services/getPlantFeature';
import { logger } from '@/lib/logger';
import { Feature } from '@/lib/types';

interface PlantFormPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function PlantFormPage({ params }: PlantFormPageProps) {
  const { type, id } = await params;
  logger.info('PlantFormPage params', { type, id });

  const { feature: initialFeature, error: initialError } = await getPlantFeature(id, type);

  logger.info('PlantFormPage props passed to PlantForm', { initialFeature, initialError });

  return <PlantForm initialFeature={initialFeature} initialError={initialError} />;
}