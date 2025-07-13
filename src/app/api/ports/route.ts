import { NextResponse, NextRequest } from 'next/server';
import Pool from '@/lib/db';
import { PortItem } from '@/lib/types2';

interface PortFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: PortItem;
}

export async function GET() {
  try {
    const client = await Pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          id,
          internal_id,
          line as line_number,
          data->>'ref_id' AS ref_id,
          data->>'project_name' AS project_name,
          data->>'location' AS city,
          data->>'country' AS country,
          data->>'trade_type' AS trade_type,
          data->>'partners' AS partners,
          data->'investment' AS investment,
          data->'status_dates' AS status_dates,
          data->>'product_type' AS product_type,
          data->>'data_source' AS data_source,
          data->>'technology_type' AS technology_type,
          data->'capacity'->'announced_size' AS announced_size,
          CASE 
            WHEN data->'coordinates'->>'latitude' ~ '^[0-9\\.-]+$' 
            THEN (data->'coordinates'->>'latitude')::double precision
            ELSE 0
          END AS latitude,
          CASE 
            WHEN data->'coordinates'->>'longitude' ~ '^[0-9\\.-]+$' 
            THEN (data->'coordinates'->>'longitude')::double precision
            ELSE 0
          END AS longitude,
          sector AS type
         FROM project_map
         WHERE sector = 'Port' `
      );

      const features: PortFeature[] = result.rows.map((row) => {
        const {
          id,
          internal_id,
          line_number,
          ref_id,
          project_name,
          city,
          country,
          trade_type,
          partners,
          investment,
          status_dates,
          product_type,
          data_source,
          technology_type,
          announced_size,
          latitude,
          longitude,
          type,
        } = row;

        const portItem: PortItem = {
          id,
          internal_id: internal_id || null,
          line_number: line_number || null,
          ref_id: ref_id || null,
          name: project_name || 'N/A',
          city: city || null,
          country: country || null,
          trade_type: trade_type || null,
          partners: partners || null,
          investment: investment ? { costs_musd: investment.costs_musd || null } : null,
          status: status_dates?.status || null,
          latitude: latitude || 0,
          longitude: longitude || 0,
          type: type.toLowerCase(),
          project_name: project_name || null,
          product_type: product_type || null,
          data_source: data_source || null,
          technology_type: technology_type || null,
          announced_size: announced_size
            ? {
                unit: announced_size.unit || null,
                value: announced_size.value ? parseFloat(announced_size.value) || 0 : null,
                vessels: announced_size.vessels ? parseInt(announced_size.vessels, 10) || null : null,
                capacity_per_vessel: announced_size.capacity_per_vessel
                  ? parseFloat(announced_size.capacity_per_vessel) || null
                  : null,
                original_text: announced_size.original_text || null,
              }
            : null,
        };

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude || 0, latitude || 0],
          },
          properties: portItem,
        };
      });

      console.log(
        'Fetched ports:',
        features.map((f) => ({
          internal_id: f.properties.internal_id,
          coordinates: f.geometry.coordinates,
        }))
      );

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


// src/app/api/ports/route.ts

// ... (keep the imports and the GET function as they are) ...

export async function POST(req: NextRequest) {
  try {
    const { internal_id, data } = await req.json();

    if (!internal_id || !data) {
        return NextResponse.json({ error: 'Missing internal_id or data payload.' }, { status: 400 });
    }

    // --- Step 1: Fetch the required metadata from the latest existing record ---
    const previousRecordQuery = `
      SELECT file_link, tab, line
      FROM project_map
      WHERE internal_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const previousRecordResult = await Pool.query(previousRecordQuery, [internal_id]);

    // --- Step 2: Handle the case where the original project doesn't exist ---
    // This is an update, so an original record must exist to copy from.
    if (previousRecordResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Cannot update project: Original project with internal_id '${internal_id}' not found.` },
        { status: 404 }
      );
    }

    const { file_link, tab, line } = previousRecordResult.rows[0];

    // --- Step 3: Insert the new record using the old metadata and new data ---
    const insertQuery = `
      INSERT INTO project_map (
        internal_id,
        data,
        sector,
        active,
        file_link,
        tab,
        line
      )
      VALUES ($1, $2, 'Port', 0, $3, $4, $5)
      RETURNING id;
    `;

    const values = [
        internal_id,
        JSON.stringify(data),
        file_link, //  Use value from the previous record
        tab,       //  Use value from the previous record
        line,      //  Use value from the previous record
    ];

    const result = await Pool.query(insertQuery, values);

    return NextResponse.json(
      { message: 'Port data saved successfully', id: result.rows[0].id },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/ports:', error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to save port data: ${errorMessage}` }, { status: 500 });
  }
}