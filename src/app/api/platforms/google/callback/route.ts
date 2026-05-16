import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encryptSensitiveData } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

// Decode base64url state (not security-critical, just obfuscation)
function decryptState(state: string): { userId: string; clientId: string; clientSecret: string } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error || !code || !state) {
      const errorMsg = errorDescription || error || 'Authorization failed';
      console.error('[Google OAuth] Error:', errorMsg);
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'${errorMsg}'},'*');window.close();</script>
          <p>Google authorization failed. You can close this window.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Decode state to get userId + clientId + clientSecret
    const stateData = decryptState(state);
    if (!stateData || !stateData.userId || !stateData.clientId || !stateData.clientSecret) {
      // Fallback: try server-side env vars (backward compatibility)
      const serverClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const serverClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!serverClientId || !serverClientSecret) {
        return new Response(
          `<html><body>
            <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Invalid state. Please try connecting again.'},'*');window.close();</script>
            <p>Invalid session. Please try again.</p>
          </body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      // Fallback: use Clerk auth for userId
      const { auth } = await import('@clerk/nextjs/server');
      const session = await auth();
      if (!session.userId) {
        return new Response(
          `<html><body>
            <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Not authenticated.'},'*');window.close();</script>
            <p>Please sign in first.</p>
          </body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      return processCallback(code, session.userId, serverClientId, serverClientSecret);
    }

    return processCallback(code, stateData.userId, stateData.clientId, stateData.clientSecret);
  } catch (err) {
    console.error('[Google OAuth] Unexpected error:', err);
    return new Response(
      `<html><body>
        <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Unexpected error'},'*');window.close();</script>
        <p>Something went wrong. You can close this window.</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function processCallback(code: string, userId: string, clientId: string, clientSecret: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app';
    const redirectUri = `${appUrl}/api/platforms/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('[Google OAuth] Token exchange failed:', tokens);
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Token exchange failed: ' + (tokens.error_description || tokens.error || 'Unknown error')},'*');window.close();</script>
          <p>Token exchange failed. You can close this window.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
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
        // Keep legacy fields for backward compatibility
        access_token: null,
        refresh_token: null,
        metadata: {
          client_id: clientId,
        },
        expires_at: Date.now() + (tokens.expires_in * 1000),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (dbError) {
      console.error('[Google OAuth] DB error:', dbError);
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Failed to save credentials'},'*');window.close();</script>
          <p>Failed to save. You can close this window.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log('[Google OAuth] Connected for user:', userId);

    return new Response(
      `<html><body>
        <h2>✅ Google Connected!</h2>
        <p>You can close this window.</p>
        <script>window.opener?.postMessage({type:'GOOGLE_AUTH_SUCCESS',message:'Google connected successfully'},'*');setTimeout(()=>window.close(),2000);</script>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    console.error('[Google OAuth] Process error:', err);
    return new Response(
      `<html><body>
        <script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Processing failed'},'*');window.close();</script>
        <p>Something went wrong. You can close this window.</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
