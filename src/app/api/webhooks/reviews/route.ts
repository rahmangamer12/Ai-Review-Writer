import { NextRequest, NextResponse } from 'next/server';
import {
  hybridWebhook,
  processManualImport,
  processScreenshot,
  processEmailForward,
} from '@/lib/webhooks/hybridWebhook';
import { autoReplyScheduler } from '@/lib/auto-reply/scheduler';
import { schedulerService } from '@/lib/schedulerService';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';
import { z } from 'zod';

// ─── Input Validation Schema ─────────────────────────────────────────────────
const webhookSchema = z.object({
  source: z.enum(['api', 'manual_import', 'screenshot', 'email_forward', 'chrome_extension']),
  data: z.record(z.string(), z.any()),
  options: z.record(z.string(), z.any()).default({}),
  userId: z.string().optional(), // Only for external webhook calls
});

function isVerifiedChromeExtension(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || '';
  const extensionId = process.env.CHROME_EXTENSION_ID;
  const extensionSecret = process.env.CHROME_EXTENSION_SHARED_SECRET;
  const providedSecret = request.headers.get('x-autoreview-extension-secret');

  if (extensionSecret && providedSecret === extensionSecret) return true;
  if (!extensionId) return false;

  return origin === `chrome-extension://${extensionId}`;
}

function isVerifiedWebhook(request: NextRequest): boolean {
  const webhookSecret = process.env.REVIEWS_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  return request.headers.get('x-webhook-secret') === webhookSecret;
}

/**
 * POST /api/webhooks/reviews
 * Main webhook endpoint for ALL review sources (HYBRID)
 * Supports: API, Manual Import, Screenshot, Email Forward, Chrome Extension
 *
 * Security: userId from body is ONLY accepted when:
 * 1. Request comes from verified external service (has webhook secret), OR
 * 2. Request is from Chrome extension (verified via origin)
 * Otherwise, Clerk auth is required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = webhookSchema.parse(body);
    const { source, data, options, userId: providedUserId } = validated;

    // ── Determine authenticated user ──────────────────────────────────────────
    let userId: string | null = null;
    let authSource: 'clerk' | 'chrome-extension' | 'none' = 'none';

    // Try Clerk auth first
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
      if (userId) authSource = 'clerk';
    } catch {
      // Auth not available
    }

    // If no Clerk auth, check for a verified Chrome extension request.
    if (!userId) {
      if (source === 'chrome_extension' && isVerifiedChromeExtension(request) && providedUserId) {
        userId = providedUserId;
        authSource = 'chrome-extension';
        console.log(`[Webhook] Chrome extension request for user: ${userId}`);
      }
    }

    if (!userId && source !== 'chrome_extension' && isVerifiedWebhook(request) && providedUserId) {
      userId = providedUserId;
      authSource = 'none';
    }

    // Rate limiting (per user or per IP for unauthenticated)
    const rateLimitKey = userId || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(rateLimitKey, RATE_LIMITS.WEBHOOK);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log(`[Webhook API] Incoming from source: ${source} for user: ${userId} (auth: ${authSource})`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedReviews: any[] = [];

    switch (source) {
      case 'api': {
        const review = await hybridWebhook.processIncomingReview(data as any, options as any);
        processedReviews.push(review);
        break;
      }
      case 'manual_import': {
        const reviews = await processManualImport(data.reviews as any, options as any);
        processedReviews.push(...reviews);
        break;
      }
      case 'screenshot': {
        const screenshotReview = await processScreenshot(data.image as string, data.metadata as any, options as any);
        processedReviews.push(screenshotReview);
        break;
      }
      case 'email_forward': {
        const emailReview = await processEmailForward(
          typeof data.email === 'string' ? { from: '', subject: '', body: data.email } : (data.email as any),
          options as any
        );
        processedReviews.push(emailReview);
        break;
      }
      case 'chrome_extension': {
        const reviewData = data.review as Record<string, unknown>;
        const extReview = await hybridWebhook.processIncomingReview(
          {
            ...reviewData,
            source: 'chrome_extension',
            id: `ext_${Date.now()}`,
          } as any,
          options as any
        );
        processedReviews.push(extReview);
        break;
      }
    }

    // Process with auto-reply rules using the new database-backed scheduler (only if userId exists)
    if (userId) {
      for (const review of processedReviews) {
        await autoReplyScheduler.processReviewWithRules(review, userId, options);
      }

      // Trigger scheduled tasks if needed (but only periodically to avoid over-triggering)
      if (schedulerService.shouldRunScheduler()) {
        console.log('[Webhook] Triggering scheduled tasks...');
        await schedulerService.executeScheduledTasks();
      }
    }

    return NextResponse.json({
      success: true,
      processed_count: processedReviews.length,
      auth_source: authSource,
      reviews: processedReviews.map((r) => ({
        id: r.id,
        source: r.source,
        platform: r.platform,
        sentiment: r.sentiment,
        ai_reply: r.ai_reply,
        status: r.status,
        needs_human_review: r.needs_human_review,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Webhook API Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process webhook', details: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/reviews
 * Get webhook status and available sources
 */
export async function GET() {
  return NextResponse.json({
    status: 'Hybrid Webhook API is running',
    security: {
      authRequired: true,
      rateLimit: true,
      inputValidation: true,
      chromeExtensionSupport: true,
    },
    sources: {
      api: { description: 'Direct API integration', requires_auth: true },
      manual_import: { description: 'CSV/Excel upload', requires_auth: true },
      screenshot: { description: 'Screenshot with OCR', requires_auth: true },
      email_forward: { description: 'Forward notification emails', requires_auth: true },
      chrome_extension: { description: 'Chrome extension scraping', requires_auth: 'via extension' },
    },
    features: [
      'Automatic sentiment analysis',
      'AI reply generation',
      'Auto-approval for positive reviews',
      'Queue for human review',
      'Multi-platform support',
    ],
    timestamp: new Date().toISOString(),
  });
}
