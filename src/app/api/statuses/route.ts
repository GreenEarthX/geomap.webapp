import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    const query = `
      SELECT DISTINCT 
        sector,
        CASE 
          WHEN sector = 'CCUS' THEN LOWER(TRIM(data->'status_date'->>'project_status'))
          WHEN sector = 'Port' THEN LOWER(TRIM(data->'status_dates'->>'status'))
          WHEN sector = 'Pipeline' THEN LOWER(TRIM(data->'status'->>'current_status'))
          ELSE LOWER(TRIM(data->'status'->>'current_status'))
        END AS current_status
      FROM project_map
      WHERE sector IN ('Production', 'Storage', 'CCUS', 'Port', 'Pipeline')
        AND (
          (sector = 'CCUS' AND data->'status_date'->>'project_status' IS NOT NULL AND TRIM(data->'status_date'->>'project_status') <> '')
          OR
          (sector IN ('Production', 'Storage', 'Pipeline') AND data->'status'->>'current_status' IS NOT NULL AND TRIM(data->'status'->>'current_status') <> '')
          OR
          (sector = 'Port' AND data->'status_dates'->>'status' IS NOT NULL AND TRIM(data->'status_dates'->>'status') <> '')
        ) AND active = 1;
      ORDER BY sector, current_status
    `;

    const result = await client.query(query);

    const statuses = result.rows.map(row => ({
      sector: row.sector,
      current_status: row.current_status
    }));

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('[getStatuses ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}