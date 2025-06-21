import pool from '@/lib/db';

export async function getLatestMapDatasets() {
  try {
    const client = await pool.connect();

    const result = await client.query(
      `SELECT solar, wind, hydrogen, storage, pipelines 
       FROM map_datasets 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    client.release();

    if (!result.rows.length) {
      throw new Error('No dataset found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[getLatestMapDatasets] DB Error:', error);
    throw new Error('Database query failed');
  }
}
