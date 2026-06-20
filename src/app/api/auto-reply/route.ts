import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledReplies,
  getAutoReplyRules,
  updateAutoReplyRule,
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
        return NextResponse.json({
          success: false,
          error: 'Auto-reply scheduling is not enabled yet.',
          message: 'Review replies can still be generated and saved manually. Scheduled auto-posting requires the Prisma scheduler model before production use.',
        }, { status: 501 });

      case 'cancel':
        return NextResponse.json({
          success: false,
          error: 'Auto-reply scheduling is not enabled yet.',
        }, { status: 501 });

      case 'execute_now':
        return NextResponse.json({
          success: false,
          error: 'Auto-reply execution is not enabled yet.',
        }, { status: 501 });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('[Auto Reply API Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
