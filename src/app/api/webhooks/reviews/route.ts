import { NextRequest, NextResponse } from 'next/server';
import { hybridWebhook, processManualImport, processScreenshot, processEmailForward } from '@/lib/webhooks/hybridWebhook';
import { autoReplyScheduler } from '@/lib/auto-reply/scheduler';
import { schedulerService } from '@/lib/schedulerService';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/webhooks/reviews
 * Main webhook endpoint for ALL review sources (HYBRID)
 * Supports: API, Manual Import, Screenshot, Email Forward
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source, // 'api', 'manual_import', 'screenshot', 'email_forward', 'chrome_extension'
      data,
      options = {},
      userId: providedUserId // Allow passing userId from external systems
    } = body;

    // Get current user using Clerk auth, but allow external webhook calls
    const { userId: authenticatedUserId } = await auth();
    const userId = providedUserId || authenticatedUserId;

    if (!userId) {
      // For unauthenticated requests, we still allow processing but skip auto-reply
      console.log(`[Webhook API] Processing unauthenticated request from source: ${source}`);
    } else {
      console.log(`[Webhook API] Incoming from source: ${source} for user: ${userId}`);
    }

    let processedReviews: any[] = [];

    switch (source) {
      case 'api':
        // Direct API webhook
        const review = await hybridWebhook.processIncomingReview(data, options);
        processedReviews = [review];
        break;

      case 'manual_import':
        // CSV/Excel upload
        processedReviews = await processManualImport(data.reviews, options);
        break;

      case 'screenshot':
        // Screenshot upload with OCR
        const screenshotReview = await processScreenshot(data.image, data.metadata, options);
        processedReviews = [screenshotReview];
        break;

      case 'email_forward':
        // Forwarded email
        const emailReview = await processEmailForward(data.email, options);
        processedReviews = [emailReview];
        break;

      case 'chrome_extension':
        // Chrome extension scraping
        const extReview = await hybridWebhook.processIncomingReview({
          ...data.review,
          source: 'chrome_extension',
          id: `ext_${Date.now()}`,
        }, options);
        processedReviews = [extReview];
        break;

      default:
        return NextResponse.json(
          { error: `Unknown source: ${source}. Supported: api, manual_import, screenshot, email_forward, chrome_extension` },
          { status: 400 }
        );
    }

    // Process with auto-reply rules using the new database-backed scheduler (only if userId exists)
    if (userId) {
      for (const review of processedReviews) {
        await autoReplyScheduler.processReviewWithRules(review, userId, options);
      }

      // Potentially trigger scheduled tasks if needed (but only periodically to avoid over-triggering)
      if (schedulerService.shouldRunScheduler()) {
        console.log('[Webhook] Triggering scheduled tasks...');
        await schedulerService.executeScheduledTasks();
      }
    }

    return NextResponse.json({
      success: true,
      processed_count: processedReviews.length,
      reviews: processedReviews.map(r => ({
        id: r.id,
        source: r.source,
        platform: r.platform,
        sentiment: r.sentiment,
        ai_reply: r.ai_reply,
        status: r.status,
        needs_human_review: r.needs_human_review,
      })),
    });

  } catch (error: any) {
    console.error('[Webhook API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
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
    sources: {
      api: { description: 'Direct API integration', requires_auth: true },
      manual_import: { description: 'CSV/Excel upload', requires_auth: false },
      screenshot: { description: 'Screenshot with OCR', requires_auth: false },
      email_forward: { description: 'Forward notification emails', requires_auth: false },
      chrome_extension: { description: 'Chrome extension scraping', requires_auth: false },
    },
    features: [
      'Automatic sentiment analysis',
      'AI reply generation',
      'Auto-approval for positive reviews',
      'Queue for human review',
      'Multi-platform support'
    ],
    timestamp: new Date().toISOString(),
  });
}
