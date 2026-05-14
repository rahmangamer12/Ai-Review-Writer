import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Allowed Origins for Manifest ────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://autoreview-ai.com',
  'https://ai-review-writer.vercel.app',
  'http://localhost:3000',
].filter(Boolean) as string[];

function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return ALLOWED_ORIGINS[0] || '*';
  if (ALLOWED_ORIGINS.some((origin) => requestOrigin.startsWith(origin))) {
    return requestOrigin;
  }
  // Allow Chrome extensions
  if (requestOrigin.startsWith('chrome-extension://')) {
    return requestOrigin;
  }
  return ALLOWED_ORIGINS[0] || '*';
}

export async function GET(request: Request) {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const requestOrigin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(requestOrigin);

    return new NextResponse(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Vary': 'Origin',
      },
    });
  } catch (error) {
    console.error('[Manifest API Error]:', error);
    return NextResponse.json({ error: 'Failed to load manifest' }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  const requestOrigin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  });
}
