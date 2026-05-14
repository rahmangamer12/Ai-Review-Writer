import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';
import { SanitizationService } from '@/lib/sanitization';

// ─── Input Validation Schema ─────────────────────────────────────────────────
const waitlistSchema = z.object({
  email: z
    .string()
    .email('Valid email required')
    .min(5, 'Email too short')
    .max(254, 'Email too long')
    .transform((val) => val.toLowerCase().trim()),
  plan: z
    .string()
    .min(1, 'Plan name required')
    .max(50, 'Plan name too long')
    .transform((val) => SanitizationService.sanitizePlatformName(val))
    .default('unknown'),
  source: z.string().max(100).optional(),
  honeypot: z.string().max(0).optional(), // Anti-bot: must be empty
});

// ─── In-memory waitlist with dedup ───────────────────────────────────────────
// NOTE: For production, replace with database (Prisma/Supabase)
const waitlist = new Map<string, { email: string; plan: string; addedAt: string; source?: string }>();

// ─── POST - Add to waitlist ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`waitlist:${clientIp}`, RATE_LIMITS.AUTH);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validated = waitlistSchema.parse(body);

    // 3. Honeypot check (anti-bot)
    if (body.honeypot && body.honeypot.length > 0) {
      // Bot detected - silently accept but don't store
      return NextResponse.json({ success: true, message: 'Added to waitlist' });
    }

    const { email, plan, source } = validated;

    // 4. Check for duplicates
    const exists = waitlist.has(email);
    if (exists) {
      return NextResponse.json(
        { success: true, message: 'You are already on the waitlist!', alreadyRegistered: true },
        { status: 200 }
      );
    }

    // 5. Store with sanitization
    waitlist.set(email, {
      email,
      plan,
      addedAt: new Date().toISOString(),
      source: source?.substring(0, 100),
    });

    console.log(`[Waitlist] New signup: ${email} (${plan}) — Total: ${waitlist.size}`);

    // 6. Limit memory usage (max 10000 entries in memory)
    if (waitlist.size > 10000) {
      // Remove oldest entries
      const entries = Array.from(waitlist.entries());
      const toRemove = entries.slice(0, 1000);
      for (const [key] of toRemove) {
        waitlist.delete(key);
      }
      console.log(`[Waitlist] Cleaned up ${toRemove.length} old entries`);
    }

    return NextResponse.json({
      success: true,
      message: 'Added to waitlist successfully!',
      position: waitlist.size,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Waitlist Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── GET - Get waitlist info (admin only) ───────────────────────────────────
export async function GET(request: NextRequest) {
  // Simple protection - in production, add admin auth
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    // Return public info only
    return NextResponse.json({
      total: waitlist.size,
      message: 'Waitlist is growing!',
    });
  }

  // Admin: return full list
  const entries = Array.from(waitlist.values()).map((entry) => ({
    email: entry.email.replace(/(?<=.{3}).(?=.*@)/g, '*'), // Mask email
    plan: entry.plan,
    addedAt: entry.addedAt,
  }));

  return NextResponse.json({
    total: waitlist.size,
    entries,
  });
}
