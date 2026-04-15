import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    
    if (!appId || appId === 'YOUR_FACEBOOK_APP_ID') {
      return NextResponse.json({ 
        error: 'Facebook OAuth not configured',
        message: 'Please set up Facebook App credentials',
        setupRequired: true,
        setupUrl: 'https://developers.facebook.com/apps'
      }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/platforms/facebook/callback`;
    
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'pages_read_engagement,pages_manage_posts');
    authUrl.searchParams.set('state', userId);

    return NextResponse.json({ success: true, authUrl: authUrl.toString() });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
