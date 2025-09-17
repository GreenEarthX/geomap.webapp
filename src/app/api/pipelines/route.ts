import { NextResponse } from 'next/server';
import Pool from '@/lib/db';

export async function GET() {
  try {
    const client = await Pool.connect();
    try {
      const result = await client.query(
        `SELECT id, internal_id, data, sector
         FROM project_map
         WHERE sector = 'Pipeline' AND active = 1;`
      );

      const features = result.rows.map((row) => {
        let geo = row.data.geometry;
        let props = row.data.properties || {};

        return {
          type: 'Feature',
          geometry: geo,
          properties: {
            id: row.id,
            internal_id: row.internal_id,
            pipeline_name: props.Project_Na || row.internal_id || 'N/A',
            infrastructure_type: 'Pipeline',
            sector: row.sector,
          },
        };
      });

      return NextResponse.json({
        pipelines: {
          type: 'FeatureCollection',
          features,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching pipelines data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
