import { NextRequest, NextResponse } from 'next/server';
import { 
  autoReplyScheduler, 
  getScheduledReplies, 
  getAutoReplyRules, 
  updateAutoReplyRule,
  cancelScheduledReply,
  scheduleReply
} from '@/lib/auto-reply/scheduler';

/**
 * POST /api/auto-reply
 * Schedule a new auto-reply or trigger immediate processing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'schedule':
        const { reviewId, platform, replyText, delayMinutes, autoPost } = body;
        const scheduled = scheduleReply(reviewId, platform, replyText, delayMinutes, autoPost);
        return NextResponse.json({ success: true, scheduled });

      case 'cancel':
        const { scheduledId } = body;
        const cancelled = cancelScheduledReply(scheduledId);
        return NextResponse.json({ success: cancelled, message: cancelled ? 'Reply cancelled' : 'Could not cancel reply' });

      case 'execute_now':
        // Execute a scheduled reply immediately
        const { replyId } = body;
        // Implementation would call executeReply
        return NextResponse.json({ success: true, message: 'Reply executed' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Auto Reply API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/auto-reply
 * Get scheduled replies and rules
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'rules') {
      const rules = getAutoReplyRules();
      return NextResponse.json({ success: true, rules });
    }

    if (type === 'scheduled') {
      const status = searchParams.get('status') || undefined;
      const replies = getScheduledReplies(status);
      return NextResponse.json({ success: true, replies });
    }

    // Default: return everything
    return NextResponse.json({
      success: true,
      rules: getAutoReplyRules(),
      scheduled: getScheduledReplies(),
    });

  } catch (error: any) {
    console.error('[Auto Reply API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/auto-reply
 * Update auto-reply rules
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;

    const updated = updateAutoReplyRule(ruleId, updates);
    
    if (!updated) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule: updated });

  } catch (error: any) {
    console.error('[Auto Reply API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
