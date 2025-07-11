import { NextResponse } from 'next/server';
import { getCCUSData } from '@/services/getCCUSData';
import { GeoJSONFeatureCollection } from '@/lib/types2';

export async function GET(): Promise<NextResponse<GeoJSONFeatureCollection | { error: string }>> {
  try {
    const data = await getCCUSData();
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}