import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// POST - User provides their own Yelp API key + Business ID
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey, businessId } = body;

    if (!apiKey || !businessId) {
      return NextResponse.json({
        error: 'Missing credentials',
        message: 'Yelp API Key and Business ID are required',
      }, { status: 400 });
    }

    // Validate the API key by making a test call to Yelp
    try {
      const testUrl = `https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=1`;
      const testRes = await fetch(testUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!testRes.ok) {
        return NextResponse.json({
          error: 'Invalid Yelp credentials',
          message: `Yelp API returned ${testRes.status}. Check your API key and Business ID.`,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Yelp connected successfully',
        directConnect: true,
      });
    } catch (fetchError) {
      return NextResponse.json({
        error: 'Connection failed',
        message: 'Could not reach Yelp API. Check your internet connection.',
      }, { status: 502 });
    }
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// GET - Check if user has connected Yelp (client-side localStorage will have the data)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Yelp uses direct API key authentication. Use POST to connect.',
    setupUrl: 'https://www.yelp.com/developers/v3/manage_app',
  });
}
