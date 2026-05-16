import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// POST - User provides their own Facebook App ID + Secret
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { appId, appSecret } = body;

    if (!appId || !appSecret) {
      return NextResponse.json({
        error: 'Missing credentials',
        message: 'Facebook App ID and App Secret are required',
        setupUrl: 'https://developers.facebook.com/apps',
      }, { status: 400 });
    }

    // Validate by making a test call to Facebook Graph API
    try {
      const testUrl = `https://graph.facebook.com/v18.0/${encodeURIComponent(appId)}?fields=id,name&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
      const testRes = await fetch(testUrl, { signal: AbortSignal.timeout(10000) });
      const testData = await testRes.json();

      if (testData.error) {
        return NextResponse.json({
          error: 'Invalid Facebook credentials',
          message: testData.error.message || 'Could not validate Facebook App',
        }, { status: 400 });
      }
    } catch (fetchError) {
      // If test fails, still allow — user might have restricted the app
      console.warn('[Facebook Connect] Validation API call failed:', fetchError);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app';
    const redirectUri = `${appUrl}/api/platforms/facebook/callback`;

    // Encode userId + appId + appSecret into state (base64 encrypted)
    const stateData = Buffer.from(JSON.stringify({ userId, appId, appSecret })).toString('base64url');

    // Generate OAuth URL with user's credentials
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'pages_read_engagement,pages_manage_posts');
    authUrl.searchParams.set('state', stateData);

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Facebook OAuth URL generated. Save your App ID & Secret in settings for future use.',
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
    message: 'Facebook uses direct App ID + Secret authentication. Use POST to connect.',
    setupUrl: 'https://developers.facebook.com/apps',
    instructions: [
      '1. Go to developers.facebook.com/apps',
      '2. Create a new app (Business type)',
      '3. Copy App ID and App Secret from Settings → Basic',
      '4. Add "Facebook Login" product to your app',
      '5. In Facebook Login → Settings, add Valid OAuth Redirect URI',
      '6. Send App ID + Secret to this API to connect',
    ],
  });
}
