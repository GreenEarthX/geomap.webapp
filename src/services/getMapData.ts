import pool from '@/lib/db';

export async function getMapData() {
  const client = await pool.connect();
  try {
    const [hydrogen, wind, solar, storage, pipelines] = await Promise.all([
      client.query('SELECT * FROM hydrogen_plants'),
      client.query('SELECT * FROM wind_plants'),
      client.query('SELECT * FROM solar_plants'),
      client.query('SELECT * FROM storage_facilities'),
      client.query('SELECT * FROM pipelines'),
    ]);

    const formatFeature = (item: any, type: string) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: { ...item, type },
    });

    const toGeoJSON = (rows: any[], type: string) => ({
      type: 'FeatureCollection',
      features: rows
        .filter(r => r.latitude !== null && r.longitude !== null)
        .map(r => formatFeature(r, type)),
    });

    const pipelineFeatures = pipelines.rows.map((p: any) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0], // TODO: replace with real data later
          [1, 1],
        ],
      },
      properties: { ...p, type: 'pipeline' },
    }));

    return {
      hydrogen: toGeoJSON(hydrogen.rows, 'hydrogen'),
      wind: toGeoJSON(wind.rows, 'wind'),
      solar: toGeoJSON(solar.rows, 'solar'),
      storage: toGeoJSON(storage.rows, 'storage'),
      pipelines: {
        type: 'FeatureCollection',
        features: pipelineFeatures,
      },
    };
  } catch (err) {
    console.error('[getMapData ERROR]', err);
    throw new Error('Failed to load data');
  } finally {
    client.release();
  }
}
