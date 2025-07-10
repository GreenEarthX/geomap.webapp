import pool from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM project_map
      WHERE sector = 'CCUS'
    `;
    const result = await client.query(query);

    return new Response(JSON.stringify(result.rows), { status: 200 });
  } finally {
    client.release();
  }
}
