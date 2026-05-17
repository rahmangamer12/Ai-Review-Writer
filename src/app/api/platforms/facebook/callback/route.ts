import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encryptSensitiveData } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

// Decrypt helper (simple base64 - not security critical, just obfuscation)
function decryptState(state: string): { userId: string; appId: string; appSecret: string } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function jsString(value: unknown): string {
  return JSON.stringify(String(value ?? ''));
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function callbackPage(type: 'success' | 'error', title: string, message: string) {
  const eventType = type === 'success' ? 'FACEBOOK_AUTH_SUCCESS' : 'FACEBOOK_AUTH_ERROR';
  const target = type === 'success' ? '/reviews' : '/connect-platforms';
  return new Response(
    `<html><body style="font-family:system-ui;background:#0a0a0f;color:white;display:grid;place-items:center;min-height:100vh;text-align:center">
      <main><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><p>Redirecting...</p></main>
      <script>
        if (window.opener) {
          window.opener.postMessage({type:${jsString(eventType)},message:${jsString(message)},error:${jsString(message)}},'*');
          setTimeout(()=>window.close(),1200);
        } else {
          setTimeout(()=>{ window.location.href=${jsString(target)}; },1200);
        }
      </script>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error || !code || !state) {
      const errorMsg = errorDescription || errorReason || error || 'Authorization failed';
      console.error('[Facebook OAuth] Error:', errorMsg);
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString(errorMsg)}},'*');window.close();</script>
          <p>Facebook authorization failed. You can close this window.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Decode state to get userId + appId + appSecret
    const stateData = decryptState(state);
    if (!stateData || !stateData.userId || !stateData.appId || !stateData.appSecret) {
      // Fallback: try server-side env vars (backward compatibility)
      const serverAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      const serverAppSecret = process.env.FACEBOOK_APP_SECRET;

      if (!serverAppId || !serverAppSecret) {
        return new Response(
          `<html><body>
            <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString('Invalid state. Please try connecting again.')}},'*');window.close();</script>
            <p>Invalid session. Please try again.</p>
          </body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      return processCallback(code, state, serverAppId, serverAppSecret);
    }

    return processCallback(code, stateData.userId, stateData.appId, stateData.appSecret);
  } catch (err) {
    console.error('[Facebook OAuth] Unexpected error:', err);
    return new Response(
      `<html><body>
        <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString('Unexpected error')}},'*');window.close();</script>
        <p>Something went wrong. You can close this window.</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function processCallback(code: string, userId: string, appId: string, appSecret: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app';
    const redirectUri = `${appUrl}/api/platforms/facebook/callback`;

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Facebook OAuth] Token exchange failed:', tokenData.error);
      const message = tokenData.error?.message || 'Unknown error';
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString(`Token exchange failed: ${message}`)}},'*');window.close();</script>
          <p>Token exchange failed. You can close this window.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const accessToken = tokenData.access_token;

    // Get user's Facebook pages
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString('No Facebook pages found. You need admin access to a Facebook page.')}},'*');window.close();</script>
          <p>No Facebook pages found. Make sure you're an admin of a Facebook page.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Use the first page
    const page = pagesData.data[0];

    const encryptedUserAccessToken = encryptSensitiveData(accessToken);
    const encryptedPageAccessToken = encryptSensitiveData(page.access_token);

    // Store credentials in Supabase
    const { error: dbError } = await supabase
      .from('platform_credentials')
      .upsert({
        user_id: userId,
        platform: 'facebook',
        access_token: null,
        refresh_token: null,
        access_token_encrypted: encryptedUserAccessToken,
        refresh_token_encrypted: encryptedPageAccessToken,
        metadata: {
          page_id: page.id,
          page_name: page.name,
          app_id: appId, // Store user's App ID for future use
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' });

    if (dbError) {
      console.error('[Facebook OAuth] DB error:', dbError);
      return new Response(
        `<html><body>
          <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString('Failed to save credentials')}},'*');window.close();</script>
          <p>Failed to save. You can close this window.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log('[Facebook OAuth] Connected page:', page.name, 'for user:', userId);

    return callbackPage('success', 'Facebook Connected!', `Connected page: ${page.name}. Open Reviews to sync and manage reviews.`);

    return new Response(
      `<html><body>
        <h2>Facebook Connected!</h2>
        <p>Page: <strong>${escapeHtml(page.name)}</strong></p>
        <p>You can close this window.</p>
        <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_SUCCESS',pageName:${jsString(page.name)}},'*');setTimeout(()=>window.close(),2000);</script>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    console.error('[Facebook OAuth] Process error:', err);
    return new Response(
      `<html><body>
        <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString('Processing failed')}},'*');window.close();</script>
        <p>Something went wrong. You can close this window.</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
