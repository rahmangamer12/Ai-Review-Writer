import { NextRequest, NextResponse } from 'next/server';
import { autoReplyScheduler } from '@/lib/auto-reply/scheduler';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';

// ─── Security: Verify Scheduler Secret ────────────────────────────────────────
function verifySchedulerSecret(request: NextRequest): { valid: boolean; source: string } {
  // Check header first (for Vercel Cron / external schedulers)
  const headerSecret = request.headers.get('x-scheduler-secret');
  const envSecret = process.env.SCHEDULER_SECRET;

  if (headerSecret && envSecret && headerSecret === envSecret) {
    return { valid: true, source: 'header' };
  }

  // Check Authorization bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && envSecret) {
    const token = authHeader.substring(7);
    if (token === envSecret) {
      return { valid: true, source: 'bearer' };
    }
  }

  return { valid: false, source: 'none' };
}

// ─── GET - Triggered by Vercel Cron (uses header auth) ──────────────────────
export async function GET(request: NextRequest) {
  try {
    // Verify scheduler secret for cron jobs
    const secretCheck = verifySchedulerSecret(request);
    if (!secretCheck.valid) {
      console.warn('[Scheduler] Unauthorized GET attempt from:', request.headers.get('x-forwarded-for') || 'unknown');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting (prevent cron job abuse)
    const rateLimitResult = await rateLimit('scheduler-cron', RATE_LIMITS.WEBHOOK);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Scheduler rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    console.log(`[Scheduler] Cron triggered via ${secretCheck.source} at ${new Date().toISOString()}`);
    await autoReplyScheduler.runScheduler();

    return NextResponse.json({
      success: true,
      message: 'Scheduler executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Scheduler GET Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scheduler execution failed',
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 to prevent cron job from being marked as failed
    );
  }
}

// ─── POST - Manual trigger (requires Clerk auth OR secret) ──────────────────
export async function POST(request: NextRequest) {
  try {
    // Try secret auth first (for external services)
    const secretCheck = verifySchedulerSecret(request);

    let userId: string | null = null;

    if (secretCheck.valid) {
      // Secret-authenticated request
      console.log(`[Scheduler] POST triggered via ${secretCheck.source}`);
    } else {
      // Try Clerk auth (for manual dashboard triggers)
      try {
        const authResult = await auth();
        userId = authResult?.userId || null;
      } catch {
        // Auth not available
      }

      if (!userId) {
        console.warn('[Scheduler] Unauthorized POST attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Rate limit per user
      const rateLimitResult = await rateLimit(userId, RATE_LIMITS.WEBHOOK);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) },
          { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const { secret: _bodySecret, ...schedulerOptions } = body;

    // If user is authenticated, use their ID
    if (userId) {
      console.log(`[Scheduler] Manual trigger by user: ${userId}`);
    }

    await autoReplyScheduler.runScheduler();

    return NextResponse.json({
      success: true,
      message: 'Scheduler executed successfully',
      triggeredBy: userId || 'cron-secret',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Scheduler POST Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scheduler execution failed',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
