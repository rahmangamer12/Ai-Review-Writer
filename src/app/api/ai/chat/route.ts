import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { longcatAI } from '@/lib/longcatAI';
import { withCSRFProtection } from '@/lib/csrfProtection';
import { normalizeLongCatModel } from '@/lib/longcatModels';
import { ensureUserProvisioned } from '@/lib/requireUser';
import { CreditsManager } from '@/lib/credits';

/**
 * API Proxy for LongCat AI Chat
 * Secures the API key on the server
 */
async function handler(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use the AI chat.' },
        { status: 401 }
      );
    }

    // Get and validate request body
    const body = await request.json();
    const { messages, model, options } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Meter this endpoint: 1 credit per AI response (consistent with the rest of
    // the app, so this proxy can't be used as an unmetered AI bypass).
    await ensureUserProvisioned(userId);
    const deduction = await CreditsManager.useCredits(
      userId,
      1,
      'ai_response',
      'AI chat (proxy) response',
    );
    if (!deduction.success) {
      if (deduction.error === 'insufficient_credits') {
        return NextResponse.json(
          { error: 'Insufficient AI credits. Please upgrade your plan.', creditsRemaining: 0 },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: 'Could not process request.' }, { status: 500 });
    }

    // Process request with server-side LongCat instance
    let reply: string;
    try {
      reply = await longcatAI.chat(
        messages,
        normalizeLongCatModel(model),
        options || {}
      );
    } catch (aiErr) {
      // Refund on failure so the user is never charged for a non-response.
      await CreditsManager.refundCredits(userId, 1, 'ai_response', 'Refund: AI chat proxy failed');
      throw aiErr;
    }

    return NextResponse.json({ reply, creditsRemaining: deduction.balanceAfter });
  } catch (error: any) {
    console.error('[AI Chat API Proxy Error]:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during AI processing' },
      { status: 500 }
    );
  }
}

// Export with CSRF protection for extra security
export const POST = withCSRFProtection(handler);
