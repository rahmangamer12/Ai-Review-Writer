import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return new NextResponse(
        `<script>window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: '${error}'}, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      return new NextResponse(
        `<script>window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: 'No code provided'}, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google token error:', tokens);
      return new NextResponse(
        `<script>window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: 'Token exchange failed'}, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(
      `<script>
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          tokens: ${JSON.stringify(tokens)}
        }, '*');
        window.close();
      </script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Google callback error:', error);
    return new NextResponse(
      `<script>window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: 'Server error'}, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
