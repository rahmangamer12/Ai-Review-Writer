import { NextRequest } from 'next/server';
import { decryptSensitiveData, encryptSensitiveData } from '@/lib/encryption';
import prisma from '@/lib/db';
import { canConnectPlatform } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

function decryptState(state: string): { userId: string; appId: string; appSecret: string } | null {
  try {
    const decrypted = decryptSensitiveData(state);
    return JSON.parse(decrypted);
  } catch {
    // Backward compatibility for OAuth sessions started before encrypted state shipped.
  }

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
  const accent = type === 'success' ? '#2563eb' : '#fb7185';
  const actionLabel = type === 'success' ? 'Open Reviews' : 'Back to Platforms';
  return new Response(
    `<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body style="margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:radial-gradient(circle at 50% 15%,rgba(37,99,235,.22),transparent 34%),#07070b;color:white;display:grid;place-items:center;min-height:100vh;text-align:center">
      <main style="width:min(92vw,520px);border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);box-shadow:0 24px 80px rgba(0,0,0,.45);border-radius:28px;padding:42px 28px">
        <div style="width:64px;height:64px;border-radius:20px;margin:0 auto 22px;background:${accent};display:grid;place-items:center;font-weight:900;color:white">F</div>
        <h2 style="font-size:28px;line-height:1.1;margin:0 0 12px">${escapeHtml(title)}</h2>
        <p style="margin:0 auto 24px;color:rgba(255,255,255,.72);line-height:1.6;max-width:420px">${escapeHtml(message)}</p>
        <a href="${target}" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:14px;background:white;color:#09090f;text-decoration:none;font-weight:800">${actionLabel}</a>
        <p style="margin:20px 0 0;color:rgba(255,255,255,.45);font-size:13px">Redirecting automatically...</p>
      </main>
      <script>
        if (window.opener) {
          window.opener.postMessage({type:${jsString(eventType)},message:${jsString(message)},error:${jsString(message)}},'*');
          setTimeout(()=>window.close(),1800);
        } else {
          setTimeout(()=>{ window.location.href=${jsString(target)}; },1800);
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

      // Fallback: resolve the real userId from Clerk (never trust the raw state string).
      const { auth } = await import('@clerk/nextjs/server');
      const session = await auth();
      if (!session.userId) {
        return new Response(
          `<html><body>
            <script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString('Not authenticated. Please sign in and try again.')}},'*');window.close();</script>
            <p>Not authenticated. Please sign in and try again.</p>
          </body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      return processCallback(code, session.userId, serverAppId, serverAppSecret);
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
    const encryptedAppSecret = encryptSensitiveData(appSecret);

    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `${userId}@autoreview.local`,
        },
      });

      // Enforce the plan's platform-connection cap (Principle 6)
      const cap = await canConnectPlatform(userId, 'facebook')
      if (!cap.allowed) {
        return new Response(
          `<html><body><script>window.opener?.postMessage({type:'FACEBOOK_AUTH_ERROR',error:${jsString(`Platform limit reached for your plan (${cap.limit}). Upgrade to connect more.`)}},'*');window.close();</script><p>Platform limit reached for your plan. You can close this window.</p></body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      await prisma.connectedPlatform.upsert({
        where: {
          userId_platformType: {
            userId,
            platformType: 'facebook',
          },
        },
        update: {
          status: 'connected',
          credentials: {
            userAccessTokenEncrypted: encryptedUserAccessToken,
            pageAccessTokenEncrypted: encryptedPageAccessToken,
            pageId: page.id,
            pageName: page.name,
            appId,
            appSecretEncrypted: encryptedAppSecret,
          },
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          platformType: 'facebook',
          status: 'connected',
          credentials: {
            userAccessTokenEncrypted: encryptedUserAccessToken,
            pageAccessTokenEncrypted: encryptedPageAccessToken,
            pageId: page.id,
            pageName: page.name,
            appId,
            appSecretEncrypted: encryptedAppSecret,
          },
        },
      });
    } catch (dbError) {
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
