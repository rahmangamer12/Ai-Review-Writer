import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Yelp uses API Key authentication
    const apiKey = process.env.YELP_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_YELP_API_KEY') {
      return NextResponse.json({ 
        error: 'Yelp API not configured',
        message: 'Please set up Yelp Fusion API key',
        setupRequired: true,
        setupUrl: 'https://www.yelp.com/developers/v3/manage_app'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Yelp API Key configured',
      directConnect: true 
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
