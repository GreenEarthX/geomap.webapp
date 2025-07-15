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

      const features = result.rows.flatMap((row) => {
        const { id, internal_id, data, sector } = row;
        const segments = data.segments || [];

        return segments.map((segment: any, index: number) => {
          const startCoords = segment.start?.latitude && segment.start?.longitude
            ? [parseFloat(segment.start.longitude), parseFloat(segment.start.latitude)]
            : [0, 0];
          const stopCoords = segment.stop?.latitude && segment.stop?.longitude
            ? [parseFloat(segment.stop.longitude), parseFloat(segment.stop.latitude)]
            : [0, 0];

          // Skip segments with invalid coordinates
          if (startCoords[0] === 0 && startCoords[1] === 0 && stopCoords[0] === 0 && stopCoords[1] === 0) {
            console.warn(`Skipping segment ${segment.segment_id} for pipeline ${internal_id}: invalid coordinates`);
            return null;
          }

          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [startCoords, stopCoords],
            },
            properties: {
              id,
              internal_id,
              pipeline_name: data.pipeline_name || 'N/A',
              segment_id: segment.segment_id || `Segment ${index + 1}`,
              segment_order: segment.segment_order || index + 1,
              start_location: segment.start?.location_name || 'N/A',
              stop_location: segment.stop?.location_name || 'N/A',
              pipeline_number: data.pipeline_number || 'N/A',
              infrastructure_type: data.infrastructure_type || 'Pipeline',
              total_segments: data.total_segments || segments.length,
              country: data.country || 'N/A',
            },
          };
        }).filter((feature: any) => feature !== null);
      });

      console.log('Fetched pipelines:', features.map(f => ({
        internal_id: f.properties.internal_id,
        segment_id: f.properties.segment_id,
        coordinates: f.geometry.coordinates,
      })));

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}