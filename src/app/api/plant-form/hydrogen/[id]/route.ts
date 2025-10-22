import { NextResponse } from 'next/server';
import { updateProductionFeature } from '@/services/projectService';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();

  const {
    name,
    status,
    start_year,
    capacity_mw,
    process,
    end_use,
    consumption_tpy,
    city,
    country,
  } = body;

  try {
    const result = await updateProductionFeature(id, {
      name,
      status,
      start_year: start_year ? String(start_year) : null,
      capacity_mw: capacity_mw ? String(capacity_mw) : null,
      process,
      end_use: end_use ? end_use.split(', ').filter((e: string) => e) : [],
      consumption_tpy: consumption_tpy ? String(consumption_tpy) : null,
      city,
      country,
    });

    if (result.length === 0) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Feature updated successfully' });
  } catch (error) {
    console.error('[updateFeature ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
