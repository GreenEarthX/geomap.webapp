import PortForm, { Feature } from '@/app/components/PortForm';
import { logger } from '@/lib/logger';

interface PortFormPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortFormPage({ params }: PortFormPageProps) {
  const { id } = await params;
  logger.info('PortFormPage params', { id });

  let initialFeature: Feature | null = null;
  let initialError: string | null = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    logger.info('Fetching port data from:', { url: `${apiUrl}/api/data/ports` });
    const response = await fetch(`${apiUrl}/api/data/ports`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch port data: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info('Fetched port data:', {
      portIds: data.ports?.features.map((f: Feature) => f.properties.internal_id) || [],
    });

    const feature = data.ports?.features.find((f: Feature) => f.properties.internal_id === id);

    if (!feature) {
      logger.warn(`No port found with internal_id: ${id}`);
      initialError = `Port with ID "${id}" not found. Please check the ID or try another port.`;
    } else {
      initialFeature = feature;
    }
  } catch (error) {
    logger.error('Error fetching port data:', error);
    initialError = `Unable to load port data for ID "${id}". Please try again later or check the ID.`;
  }

  logger.info('PortFormPage props passed to PortForm', { initialFeature, initialError });

  return <PortForm initialFeature={initialFeature} initialError={initialError} />;
}