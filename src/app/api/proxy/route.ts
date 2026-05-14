import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';

// ─── Security: Allowed Domains Whitelist ─────────────────────────────────────
const ALLOWED_DOMAINS = [
  // AI Services
  'api.longcat.chat',
  'api.openai.com',
  'generativelanguage.googleapis.com',
  // Review Platforms (for Chrome Extension)
  'maps.googleapis.com',
  'mybusiness.googleapis.com',
  'graph.facebook.com',
  'api.yelp.com',
  'api.trustpilot.com',
  // Payment
  'api.lemonsqueezy.com',
  // Email
  'api.resend.com',
  // Your own domain
  ...(process.env.NEXT_PUBLIC_APP_URL ? [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname] : []),
  'ai-review-writer.vercel.app',
  'autoreview-ai.com',
];

// ─── Security: Blocked URL Patterns ──────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /^https?:\/\/127\./,           // localhost
  /^https?:\/\/10\./,             // private network
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./, // private network
  /^https?:\/\/192\.168\./,       // private network
  /^https?:\/\/0\./,              // current network
  /^https?:\/\/169\.254\./,       // link-local
  /^https?:\/\/localhost/i,       // localhost name
  /^file:\/\//i,                  // file protocol
  /^ftp:\/\//i,                   // ftp protocol
  /^data:/i,                      // data URI
  /^javascript:/i,                // javascript protocol
];

function isUrlAllowed(urlString: string): { allowed: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { allowed: false, reason: 'Invalid URL format' };
  }

  // Only allow https (and http for localhost dev)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { allowed: false, reason: 'Only HTTP/HTTPS protocols allowed' };
  }

  // Check blocked patterns (SSRF protection)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(urlString)) {
      return { allowed: false, reason: 'URL points to internal/private network' };
    }
  }

  // Check domain whitelist
  const isAllowedDomain = ALLOWED_DOMAINS.some(domain => {
    return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
  });

  if (!isAllowedDomain) {
    return { allowed: false, reason: `Domain ${parsed.hostname} is not in whitelist` };
  }

  return { allowed: true };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, status: 401, data: { error: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(userId, RATE_LIMITS.API_STANDARD);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { ok: false, status: 429, data: { error: rateLimitResult.message } },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const { url, headers: requestHeaders, method = 'GET' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, status: 400, data: { error: 'URL is required' } },
        { status: 400 }
      );
    }

    // 4. URL length limit
    if (url.length > 2048) {
      return NextResponse.json(
        { ok: false, status: 400, data: { error: 'URL too long (max 2048 chars)' } },
        { status: 400 }
      );
    }

    // 5. Validate URL against whitelist (SSRF Protection)
    const urlCheck = isUrlAllowed(url);
    if (!urlCheck.allowed) {
      console.warn(`[Proxy] Blocked URL: ${url} - Reason: ${urlCheck.reason} - User: ${userId}`);
      return NextResponse.json(
        { ok: false, status: 403, data: { error: `URL blocked: ${urlCheck.reason}` } },
        { status: 403 }
      );
    }

    // 6. Only allow safe HTTP methods
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH'];
    if (!allowedMethods.includes(method.toUpperCase())) {
      return NextResponse.json(
        { ok: false, status: 400, data: { error: 'Method not allowed' } },
        { status: 400 }
      );
    }

    // 7. Sanitize forwarded headers (prevent header injection)
    const sanitizedHeaders: Record<string, string> = {};
    if (requestHeaders && typeof requestHeaders === 'object') {
      const blockedHeaders = ['host', 'origin', 'referer', 'cookie', 'authorization', 'x-forwarded-for'];
      for (const [key, value] of Object.entries(requestHeaders)) {
        if (!blockedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
          sanitizedHeaders[key] = value;
        }
      }
    }

    // 8. Add identification header
    sanitizedHeaders['X-Proxy-By'] = 'autoreview-ai';

    // 9. Make the request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers: sanitizedHeaders,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      // 10. Limit response size (prevent memory exhaustion)
      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json(
          { ok: false, status: 413, data: { error: 'Response too large (max 10MB)' } },
          { status: 413 }
        );
      }

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { text: await res.text() };
      }

      return NextResponse.json({
        ok: res.ok,
        status: res.status,
        data,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { ok: false, status: 504, data: { error: 'Request timeout (30s exceeded)' } },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('[Proxy Error]:', error);
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        data: { error: error instanceof Error ? error.message : 'Proxy fetch failed' },
      },
      { status: 500 }
    );
  }
}

// ─── GET - Status Check ──────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'Proxy API is running',
    security: {
      ssrfProtection: true,
      domainWhitelist: true,
      authRequired: true,
      rateLimit: true,
      maxResponseSize: '10MB',
      timeout: '30s',
    },
    allowedDomains: ALLOWED_DOMAINS,
    timestamp: new Date().toISOString(),
  });
}
