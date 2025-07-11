import { NextResponse } from 'next/server';
import { getProductionData } from '@/services/getProductionData';
import { GeoJSONFeatureCollection } from '@/lib/types2';

export async function GET(): Promise<NextResponse<GeoJSONFeatureCollection | { error: string }>> {
  try {
    const data = await getProductionData();
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}