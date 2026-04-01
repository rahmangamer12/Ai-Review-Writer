import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const dynamic = 'force-dynamic'

// Configure LongCat as a custom OpenAI provider
const longcat = createOpenAI({
  apiKey: process.env.LONGCAT_AI_API_KEY,
  baseURL: 'https://api.longcat.chat/openai/v1',
});

// Allowed models for security
const ALLOWED_MODELS = [
  'LongCat-Flash-Chat',
  'LongCat-Flash-Thinking',
  'LongCat-Flash-Thinking-2601',
  'LongCat-Flash-Lite',
  'LongCat-Flash-Omni-2603',
];

// Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export async function POST(request: NextRequest) {
  try {
    // Quick auth check without triggering full session validation
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use the AI chat.' },
        { status: 401 }
      )
    }

    // Skip rate limiting for now to avoid issues

    // Model Validation
    const body = await request.json();
    
    // 2. Fetch User & Verify Credits
    let userDb = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { aiCredits: true, promptCount: true, email: true, name: true, planType: true }
    });

    if (!userDb) {
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@unknown.com`;
      const userName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || 'User';

      userDb = await (prisma.user as any).create({
        data: {
          id: userId,
          email: userEmail,
          name: userName,
          planType: 'free',
          aiCredits: 20,
          promptCount: 0,
          maxPlatforms: 1,
        },
        select: { aiCredits: true, promptCount: true, email: true, name: true, planType: true }
      });
    }

    if (!userDb || userDb.aiCredits <= 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient AI credits or user not found. Please upgrade your plan to continue chatting.',
          creditsRemaining: 0
        },
        { status: 402 }
      );
    }

    // 3. Request Parameters
    const { messages, model: selectedModel = 'LongCat-Flash-Chat', temperature = 0.7 } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Model Validation
    if (!ALLOWED_MODELS.includes(selectedModel)) {
      return NextResponse.json(
        { error: 'Invalid model selected. Please choose from allowed models.' },
        { status: 400 }
      );
    }

    // Check if LongCat is available
    if (!process.env.LONGCAT_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI models are currently unavailable. Please check your API key.' },
        { status: 503 }
      );
    }

    // 4. Provider Routing
    const provider = longcat;

    console.log(`[Chat API] Using LongCat for model: ${selectedModel}`);

    const currentPromptCount = (userDb as any).promptCount ?? 0;
    const currentCredits = (userDb as any).aiCredits ?? 0;

    // 5. Save User Message to DB (if session exists)
    const sessionId = request.headers.get('x-session-id');
    if (sessionId && sessionId !== 'new' && messages.length > 0) {
      const lastUserMsg = messages[messages.length - 1];
      
      try {
        // Ensure session exists
        await prisma.chatSession.upsert({
          where: { id: sessionId },
          update: { updatedAt: new Date() },
          create: {
            id: sessionId,
            userId,
            title: typeof lastUserMsg.content === 'string' 
              ? lastUserMsg.content.slice(0, 30) 
              : 'New Conversation'
          }
        });

        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'user',
            content: typeof lastUserMsg.content === 'string' ? lastUserMsg.content : JSON.stringify(lastUserMsg.content)
          }
        });
      } catch (err) {
        console.error('[Chat API] Session/Message save failed:', err);
      }
    }

    // 6. Use Vercel AI SDK streamText 
    const modelMessages: any[] = messages.map((m: any) => {
      const role = ['system', 'user', 'assistant', 'tool'].includes(m.role) ? m.role : 'user';
      if (role === 'system' || role === 'assistant') {
        const textContent = Array.isArray(m.content) 
          ? m.content.map((p: any) => p.text || '').join('\n') 
          : (m.content || '');
        return { role, content: String(textContent) };
      }
      if (role === 'user' && Array.isArray(m.content)) {
        return {
          role,
          content: m.content.map((part: any) => {
            if (part.type === 'image_url') {
              return { type: 'image', image: part.image_url?.url || '' };
            }
            if (part.type === 'text') return { type: 'text', text: part.text || '' };
            return part;
          })
        };
      }
      return { role, content: String(m.content || '') };
    });

    const result = streamText({
      model: provider.chat(selectedModel),
      messages: modelMessages,
      temperature,
      maxOutputTokens: 4000,
      onFinish: async ({ text }) => {
        try {
          const nextPromptCount = currentPromptCount + 1;
          if (nextPromptCount >= 10) {
            await (prisma.user as any).update({
              where: { id: userId },
              data: { aiCredits: { decrement: 1 }, promptCount: 0 }
            });
          } else {
            await (prisma.user as any).update({
              where: { id: userId },
              data: { promptCount: { increment: 1 } }
            });
          }

          const sessionId = request.headers.get('x-session-id');
          if (sessionId && sessionId !== 'new') {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: text
              }
            });
          }
        } catch (dbErr) {
          console.error('[Chat API] Database update error:', dbErr);
        }
      }
    });

    // @ts-expect-error - experimental flag for AI SDK
    result.experimental_includeUsage = false;
    return new Response(result.textStream, {
       headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-credits-remaining': currentCredits.toString(),
        'x-prompt-count': ((currentPromptCount + 1) % 10).toString()
       }
    });

  } catch (error: any) {
    console.error('[Chat API Error]:', error);
    
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      success: false
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Chat API (Multi-Provider Streaming) is running',
    timestamp: new Date().toISOString()
  });
}
