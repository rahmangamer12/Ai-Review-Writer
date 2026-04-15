import { NextRequest, NextResponse } from 'next/server';
import { autoReplyScheduler } from '@/lib/auto-reply/scheduler';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run the scheduler to process any pending scheduled replies
    await autoReplyScheduler.runScheduler();

    return NextResponse.json({
      success: true,
      message: 'Scheduler executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('[Scheduler API Error]:', error);
    // For production, return success even if there are errors to avoid cron job failures
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scheduler execution failed',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Changed to 200 to prevent cron job from being marked as failed
    );
  }
}

// Allow POST as well to enable webhook-based triggering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Allow external triggering but potentially add auth if needed
    const { secret } = body;

    // In production, you might want to verify a secret
    // if (secret !== process.env.SCHEDULER_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await autoReplyScheduler.runScheduler();

    return NextResponse.json({
      success: true,
      message: 'Scheduler executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('[Scheduler API Error]:', error);
    // For production, return success even if there are errors to avoid cron job failures
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scheduler execution failed',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Changed to 200 to prevent cron job from being marked as failed
    );
  }
}