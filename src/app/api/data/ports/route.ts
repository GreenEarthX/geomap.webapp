import { NextResponse } from 'next/server';
import Pool from '@/lib/db';

export async function GET() {
  try {
    const client = await Pool.connect();
    try {
      const result = await client.query(
        `SELECT id, internal_id, data, sector
         FROM project_map
         WHERE sector = 'Port'`
      );

      const features = result.rows.map((row) => {
        const { id, internal_id, data, sector } = row;
        const coordinates = data.coordinates?.latitude && data.coordinates?.longitude
          ? [parseFloat(data.coordinates.longitude), parseFloat(data.coordinates.latitude)]
          : [0, 0];

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates,
          },
          properties: {
            id,
            internal_id,
            name: data.project_name || 'N/A',
            status: data.status_dates?.status || 'N/A',
            type: sector.toLowerCase(),
            capacity_kt_y: data.capacity?.capacity_kt_y?.value || null,
            announced_size: data.capacity?.announced_size || data.capacity?.storage_capacity_tonnes || null,
            trade_type: data.trade_type || 'N/A',
            partners: data.partners || 'N/A',
            investment: data.investment || null,
            country: data.country || 'N/A',
            city: data.location || 'N/A',
          },
        };
      });

      console.log('Fetched ports:', features.map(f => ({
        internal_id: f.properties.internal_id,
        coordinates: f.geometry.coordinates,
      })));

      return NextResponse.json({
        ports: {
          type: 'FeatureCollection',
          features,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching ports data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}