import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Feature } from '@/app/components/LeafletMap';

export async function GET(request: Request, { params }: { params: { type: string; id: string } }) {
  const client = await pool.connect();
  try {
    const id = parseInt(params.id);
    const type = params.type.toLowerCase();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const validTypes = ['hydrogen', 'wind', 'solar', 'storage', 'pipeline'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid feature type' }, { status: 400 });
    }

    const tableMap: { [key: string]: string } = {
      hydrogen: 'hydrogen_plants',
      wind: 'wind_plants',
      solar: 'solar_plants',
      storage: 'storage_facilities',
      pipeline: 'pipelines',
    };

    const formatFeature = (item: any, type: string): Feature => ({
      type: 'Feature',
      geometry: {
        type: type === 'pipeline' ? 'LineString' : 'Point',
        coordinates:
          type === 'pipeline'
            ? [[0, 0], [1, 1]] // Placeholder, replace with real pipeline coordinates later
            : [item.longitude, item.latitude],
      },
      properties: { ...item, type },
    });

    const table = tableMap[type];
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const feature = formatFeature(result.rows[0], type);
    return NextResponse.json(feature);
  } catch (error) {
    console.error('[getFeatureById ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}