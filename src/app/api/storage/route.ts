import { NextResponse, NextRequest } from 'next/server';
import { getStorageData } from '@/services/getStorageData';
import { GeoJSONFeatureCollection } from '@/lib/types2';
import Pool from '@/lib/db';


export async function GET(): Promise<NextResponse<GeoJSONFeatureCollection | { error: string }>> {
  try {
    const data = await getStorageData();
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { internal_id, data } = body;

    // Validate input
    if (!internal_id || typeof internal_id !== 'string') {
      console.error('Invalid or missing internal_id', { internal_id });
      return NextResponse.json({ error: 'Invalid or missing internal_id' }, { status: 400 });
    }
    if (!data || typeof data !== 'object') {
      console.error('Invalid or missing data', { data });
      return NextResponse.json({ error: 'Invalid or missing data' }, { status: 400 });
    }

    // Ensure line_number is string | null
    if (data.line_number !== undefined && data.line_number !== null && typeof data.line_number !== 'string') {
      console.error('Invalid line_number type', { line_number: data.line_number });
      return NextResponse.json({ error: 'line_number must be a string or null' }, { status: 400 });
    }

    const client = await Pool.connect();
    try {
      // Fetch the original record to copy file_link, tab, line, and sector
      const originalResult = await client.query(
        `
        SELECT file_link, tab, line, sector
        FROM project_map
        WHERE internal_id = $1 AND sector = $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [internal_id, 'Storage']
      );

      if (originalResult.rows.length === 0) {
        console.error('No Storage record found for internal_id', { internal_id });
        return NextResponse.json({ error: `No Storage record found for internal_id: ${internal_id}` }, { status: 404 });
      }

      const { file_link, tab, line, sector } = originalResult.rows[0];

      // Insert new record with updated data
      const insertResult = await client.query(
        `
        INSERT INTO project_map (
          internal_id,
          data,
          file_link,
          tab,
          line,
          sector,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id
        `,
        [internal_id, data, file_link, tab || 'Storage', line, sector || 'Storage']
      );

      const newId = insertResult.rows[0].id;
      console.log('New Storage record created', { id: newId, internal_id });

      return NextResponse.json({ id: newId }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing Storage POST request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}