import { NextRequest } from 'next/server';

const ELECTRIC_URL = 'https://api.electric-sql.cloud';
const SOURCE_ID = process.env.ELECTRIC_SOURCE_ID!;
const SOURCE_SECRET = process.env.ELECTRIC_SOURCE_SECRET!;

// Allowed origins for CORS - add your production domain here
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://stateofcode.ai',
  'https://www.stateofcode.ai',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

// Allowed tables for syncing
const ALLOWED_TABLES = ['surveys', 'categories', 'questions', 'survey_questions', 'sessions', 'responses'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string[] }> }
) {
  const { table } = await params;
  const tableName = table.join('/');

  // Validate table name
  if (!ALLOWED_TABLES.includes(tableName)) {
    return new Response(JSON.stringify({ error: 'Table not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get query parameters from the request
  const url = new URL(request.url);
  const searchParams = new URLSearchParams();

  // Copy allowed params
  const allowedParams = ['offset', 'handle', 'live', 'cursor', 'where', 'columns'];
  for (const param of allowedParams) {
    const value = url.searchParams.get(param);
    if (value) {
      searchParams.set(param, value);
    }
  }

  // Build Electric URL
  const electricUrl = new URL(`${ELECTRIC_URL}/v1/shape`);
  electricUrl.searchParams.set('source_id', SOURCE_ID);
  electricUrl.searchParams.set('table', tableName);
  
  // Add other params
  searchParams.forEach((value, key) => {
    electricUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(electricUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${SOURCE_SECRET}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Electric API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Electric sync failed', details: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get response headers we need to forward
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json');
    
    // Forward Electric-specific headers
    const electricHeaders = [
      'electric-handle',
      'electric-offset', 
      'electric-cursor',
      'electric-up-to-date',
      'electric-schema',
    ];
    
    for (const header of electricHeaders) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }

    // Enable CORS for client-side requests (restricted to allowed origins)
    const origin = request.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    headers.set('Access-Control-Expose-Headers', electricHeaders.join(', '));

    const body = await response.text();
    
    return new Response(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Electric proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return new Response(null, {
    status: 204,
    headers,
  });
}


