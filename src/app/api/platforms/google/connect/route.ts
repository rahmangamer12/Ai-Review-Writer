import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// POST - User provides their own Google Client ID + Secret
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, clientSecret } = body;
    const resolvedClientId = clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const resolvedClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;

    if (!resolvedClientId || !resolvedClientSecret) {
      return NextResponse.json({
        error: 'Missing credentials',
        message: 'Google Client ID and Client Secret are required. Add them in Vercel env or enter them on this page.',
        setupUrl: 'https://console.cloud.google.com/apis/credentials',
      }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app';
    const redirectUri = `${appUrl}/api/platforms/google/callback`;

    // Encode userId + clientId + clientSecret into state
    const stateData = Buffer.from(JSON.stringify({
      userId,
      clientId: resolvedClientId,
      clientSecret: resolvedClientSecret,
    })).toString('base64url');

    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', resolvedClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', stateData);

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      message: clientId && clientSecret
        ? 'Google OAuth URL generated with user credentials.'
        : 'Google OAuth URL generated with platform environment credentials.',
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// GET - Return setup instructions
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Google uses direct OAuth credentials. Use POST to connect.',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    instructions: [
      '1. Go to console.cloud.google.com',
      '2. Create a new project (or select existing)',
      '3. Enable "My Business Business Information API"',
      '4. Go to APIs & Services → Credentials',
      '5. Create OAuth Client ID (Web application)',
      '6. Add redirect URI: {appUrl}/api/platforms/google/callback',
      '7. Copy Client ID + Client Secret and send via POST',
    ],
  });
}
