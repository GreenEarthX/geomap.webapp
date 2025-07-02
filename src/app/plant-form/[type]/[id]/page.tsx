import PlantForm from '@/app/components/PlantForm';
import { Feature } from '@/app/components/LeafletMap';
import pool from '@/lib/db';

interface PlantFormPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function PlantFormPage({ params }: PlantFormPageProps) {
  const { type, id } = await params; // Await params to resolve the Promise
  const client = await pool.connect();
  let initialFeature: Feature | null = null;
  let initialError: string | null = null;

  console.log('[PlantFormPage] Params:', { type, id });

  try {
    const parsedId = parseInt(id, 10);
    const lowercaseType = type.toLowerCase();

    if (isNaN(parsedId)) {
      initialError = 'Invalid ID';
    } else {
      const validTypes = ['hydrogen', 'wind', 'solar', 'storage', 'pipeline'];
      if (!validTypes.includes(lowercaseType)) {
        initialError = 'Invalid feature type';
      } else {
        const tableMap: { [key: string]: string } = {
          hydrogen: 'hydrogen_plants',
          wind: 'wind_plants',
          solar: 'solar_plants',
          storage: 'storage_facilities',
          pipeline: 'pipelines',
        };

        const formatFeature = (item: any, type: string): Feature => {
          const feature: Feature = {
            type: 'Feature',
            geometry: {
              type: type === 'pipeline' ? 'LineString' : 'Point',
              coordinates:
                type === 'pipeline'
                  ? item.coordinates
                    ? JSON.parse(item.coordinates)
                    : [[0, 0], [1, 1]]
                  : [item.longitude || 0, item.latitude || 0],
            },
            properties: {
              id: item.id ?? parsedId,
              name: item.name ?? 'Unknown Feature',
              type,
              status: String(item.status ?? ''),
              start_year: item.start_year ?? 0,
              capacity_mw: item.capacity_mw ?? 0,
              process: String(item.process ?? ''),
              end_use: String(item.end_use ?? ''),
              consumption_tpy: item.consumption_tpy ?? 0,
              city: String(item.city ?? ''),
              country: String(item.country ?? ''),
              last_researched: String(item.last_researched ?? ''),
              technology: String(item.technology ?? ''),
              location: String(item.location ?? ''),
              pipeline_nr: item.pipeline_nr ?? 0,
              segment: String(item.segment ?? ''),
              start: String(item.start ?? ''),
              stop: String(item.stop ?? ''),
              approx_location_start: String(item.approx_location_start ?? ''),
              approx_location_stop: String(item.approx_location_stop ?? ''),
            },
          };
          console.log('[PlantFormPage] Formatted feature:', feature);
          return feature;
        };

        const table = tableMap[lowercaseType];
        const query = `SELECT * FROM ${table} WHERE id = $1`;
        const result = await client.query(query, [parsedId]);

        if (result.rows.length === 0) {
          initialError = 'Feature not found';
        } else {
          initialFeature = formatFeature(result.rows[0], lowercaseType);
        }
      }
    }
  } catch (error) {
    console.error('[PlantFormPage ERROR]', error);
    initialError = 'Internal server error';
  } finally {
    client.release();
  }

  console.log('[PlantFormPage] Props passed to PlantForm:', { initialFeature, initialError });

  return <PlantForm initialFeature={initialFeature} initialError={initialError} />;
}