import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { validateRedirect } from '@/lib/oauthSecurity';
import { encryptSensitiveData } from '@/lib/encryption';

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
    const state = searchParams.get('state');
    const redirect = searchParams.get('redirect');

    // Validate redirect URL to prevent open redirect attacks
    const safeRedirect = validateRedirect(redirect)

    // Validate state parameter (should match userId for basic CSRF protection)
    if (state !== userId) {
      console.error('[Google OAuth] State mismatch - possible CSRF attack')
      return new NextResponse(
        `<script>window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: 'Invalid state parameter'}, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

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

    // Store tokens securely in ENCRYPTED form (AES-256-GCM)
    const encryptedAccessToken = encryptSensitiveData(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptSensitiveData(tokens.refresh_token)
      : null;

    const { error: dbError } = await supabase
      .from('platform_credentials')
      .upsert({
        user_id: userId,
        platform: 'google',
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        // Keep legacy fields for backward compatibility (will be migrated)
        access_token: null,
        refresh_token: null,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (dbError) {
      console.error('Failed to store tokens:', dbError);
    }

    // Send success to frontend (without tokens in URL)
    return new NextResponse(
      `<script>
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          message: 'Google connected successfully',
          redirect: '${safeRedirect}'
        }, '*');
        window.close();
      </script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: unknown) {
    console.error('Google callback error:', error);
    return new NextResponse(
      `<script>window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: 'Server error'}, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
