import { NextRequest, NextResponse } from 'next/server';
import { getLatestMapDatasets } from '@/services/mapDatasetService';

export async function GET(_req: NextRequest) {
  try {
    const datasets = await getLatestMapDatasets();
    return NextResponse.json(datasets);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
