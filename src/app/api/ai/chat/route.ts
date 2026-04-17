import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { longcatAI } from '@/lib/longcatAI';
import { withCSRFProtection } from '@/lib/csrfProtection';

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

    // Process request with server-side LongCat instance
    const reply = await longcatAI.chat(
      messages,
      model || 'LongCat-Flash-Chat',
      options || {}
    );

    return NextResponse.json({ reply });
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
