import { NextRequest } from 'next/server';
import { decryptSensitiveData, encryptSensitiveData } from '@/lib/encryption';
import prisma from '@/lib/db';
import { canConnectPlatform } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

function jsString(value: unknown): string {
  return JSON.stringify(String(value ?? ''));
}

function callbackPage(type: 'success' | 'error', title: string, message: string) {
  const eventType = type === 'success' ? 'GOOGLE_AUTH_SUCCESS' : 'GOOGLE_AUTH_ERROR';
  const target = type === 'success' ? '/reviews' : '/connect-platforms';
  const accent = type === 'success' ? '#22c55e' : '#fb7185';
  const actionLabel = type === 'success' ? 'Open Reviews' : 'Back to Platforms';
  return new Response(
    `<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body style="margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:radial-gradient(circle at 50% 15%,rgba(124,58,237,.22),transparent 34%),#07070b;color:white;display:grid;place-items:center;min-height:100vh;text-align:center">
      <main style="width:min(92vw,520px);border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);box-shadow:0 24px 80px rgba(0,0,0,.45);border-radius:28px;padding:42px 28px">
        <div style="width:64px;height:64px;border-radius:20px;margin:0 auto 22px;background:${accent};display:grid;place-items:center;font-weight:900;color:#07070b">G</div>
        <h2 style="font-size:28px;line-height:1.1;margin:0 0 12px">${title}</h2>
        <p style="margin:0 auto 24px;color:rgba(255,255,255,.72);line-height:1.6;max-width:420px">${message}</p>
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

function decryptState(state: string): { userId: string; clientId: string; clientSecret: string } | null {
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
      return callbackPage('error', 'Google authorization failed', errorMsg);
    }

    // Decode state to get userId + clientId + clientSecret
    const stateData = decryptState(state);
    if (!stateData || !stateData.userId || !stateData.clientId || !stateData.clientSecret) {
      // Fallback: try server-side env vars (backward compatibility)
      const serverClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const serverClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!serverClientId || !serverClientSecret) {
        return callbackPage('error', 'Invalid session', 'Invalid state. Please try connecting again.');
      }

      // Fallback: use Clerk auth for userId
      const { auth } = await import('@clerk/nextjs/server');
      const session = await auth();
      if (!session.userId) {
        return callbackPage('error', 'Please sign in first', 'Not authenticated.');
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
    const encryptedClientSecret = encryptSensitiveData(clientSecret);

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
      const cap = await canConnectPlatform(userId, 'google')
      if (!cap.allowed) {
        return new Response(
          `<html><body><script>window.opener?.postMessage({type:'GOOGLE_AUTH_ERROR',error:'Platform limit reached for your plan (${cap.limit}). Upgrade to connect more.'},'*');window.close();</script><p>Platform limit reached for your plan. You can close this window.</p></body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }

      await prisma.connectedPlatform.upsert({
        where: {
          userId_platformType: {
            userId,
            platformType: 'google',
          },
        },
        update: {
          status: 'connected',
          credentials: {
            accessTokenEncrypted: encryptedAccessToken,
            refreshTokenEncrypted: encryptedRefreshToken,
            clientId,
            clientSecretEncrypted: encryptedClientSecret,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
          },
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          platformType: 'google',
          status: 'connected',
          credentials: {
            accessTokenEncrypted: encryptedAccessToken,
            refreshTokenEncrypted: encryptedRefreshToken,
            clientId,
            clientSecretEncrypted: encryptedClientSecret,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
          },
        },
      });
    } catch (dbError) {
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
    return callbackPage('success', 'Google Connected!', 'Google connected successfully. Open Reviews to sync and manage reviews.');
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
