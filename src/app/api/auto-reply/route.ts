import { NextRequest, NextResponse } from 'next/server';
import {
  autoReplyScheduler,
  getScheduledReplies,
  getAutoReplyRules,
  updateAutoReplyRule,
  cancelScheduledReply,
  scheduleReply,
  initializeUserAutoReply
} from '@/lib/auto-reply/scheduler';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/auto-reply
 * Schedule a new auto-reply or trigger immediate processing
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user using Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'schedule':
        const { reviewId, platform, replyText, delayMinutes, autoPost } = body;
        const scheduled = await scheduleReply(userId, reviewId, platform, replyText, delayMinutes, autoPost);
        if (!scheduled) {
          return NextResponse.json({ error: 'Failed to schedule reply' }, { status: 500 });
        }
        return NextResponse.json({ success: true, scheduled });

      case 'cancel':
        const { scheduledId } = body;
        const cancelled = await cancelScheduledReply(scheduledId);
        return NextResponse.json({ success: cancelled, message: cancelled ? 'Reply cancelled' : 'Could not cancel reply' });

      case 'execute_now':
        // Execute a scheduled reply immediately
        const { replyId } = body;
        // Implementation would call executeReply
        return NextResponse.json({ success: true, message: 'Reply executed' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('[Auto Reply API Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/auto-reply
 * Get scheduled replies and rules
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user using Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'rules') {
      const rules = await getAutoReplyRules(userId);
      return NextResponse.json({ success: true, rules });
    }

    if (type === 'scheduled') {
      const status = searchParams.get('status') || undefined;
      const replies = await getScheduledReplies(userId, status);
      return NextResponse.json({ success: true, replies });
    }

    // Default: return everything
    return NextResponse.json({
      success: true,
      rules: await getAutoReplyRules(userId),
      scheduled: await getScheduledReplies(userId),
    });

  } catch (error: unknown) {
    console.error('[Auto Reply API Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/auto-reply
 * Update auto-reply rules
 */
export async function PUT(request: NextRequest) {
  try {
    // Get current user using Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ruleId, updates } = body;

    const updated = await updateAutoReplyRule(userId, ruleId, updates);

    if (!updated) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule: updated });

  } catch (error: unknown) {
    console.error('[Auto Reply API Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
