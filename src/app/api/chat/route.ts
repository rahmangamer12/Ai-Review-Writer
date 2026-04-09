import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';
import { z } from 'zod';

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
  // 'LongCat-Flash-Omni-2603', // Temporarily disabled - API returns "json format error"
];

// Input validation schema
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.union([z.string(), z.array(z.any())])
  })).min(1),
  model: z.enum(ALLOWED_MODELS as [string, ...string[]]).default('LongCat-Flash-Chat'),
  temperature: z.number().min(0).max(2).default(0.7)
});

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

    // Rate limiting - 20 chat requests per minute
    const rateLimitResult = await rateLimit(userId, RATE_LIMITS.AI_ANALYSIS)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.message,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Validate input
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);

    const { messages, model: selectedModel, temperature } = validated;

    // Check if LongCat is available
    if (!process.env.LONGCAT_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI models are currently unavailable. Please check your API key.' },
        { status: 503 }
      );
    }

    // Simplified user check - only verify credits, don't create user here
    let userDb = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { aiCredits: true, promptCount: true }
    });

    // If user doesn't exist, return error (user should be created on sign-up)
    if (!userDb || userDb.aiCredits <= 0) {
      return NextResponse.json(
        {
          error: 'Insufficient AI credits. Please upgrade your plan to continue chatting.',
          creditsRemaining: 0
        },
        { status: 402 }
      );
    }

    const provider = longcat;
    console.log(`[Chat API] Using LongCat for model: ${selectedModel}`);

    const currentPromptCount = (userDb as any).promptCount ?? 0;
    const currentCredits = (userDb as any).aiCredits ?? 0;

    // Skip session save during streaming for speed - save after response completes
    const sessionId = request.headers.get('x-session-id');

    const formattedMessages: any[] = messages.map((m: any) => {
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

    const godTierPrompt = {
      role: 'system',
      content: `You are Sarah, the God-Tier AI Assistant for "AutoReview AI" platform. 
You possess absolute, expert-level knowledge of everything related to AutoReview AI—our platform imports, manages, and automatically replies to reviews from Google, Yelp, Facebook, etc., and uses LongCat AI to save businesses hours of work daily. Our plans: Free ($0), Starter ($10/m), Pro ($19/m), Enterprise ($39/m).

CRITICAL INSTRUCTIONS FOR YOU:
1. You are a God-Tier general purpose AI as well. If the user asks ANY question—whether it be coding, general knowledge, math, science, philosophy, or writing—you MUST answer it perfectly and enthusiastically. NEVER say "I only answer questions about AutoReview AI."
2. Always maintain a warm, helpful, and highly intelligent persona. Use emojis occasionally.
3. Be transparent, direct, and incredibly thorough. Give the most informative and accurate answers possible!
4. Always respond in the exact language the user queries you in.`
    };

    const modelMessages = [godTierPrompt, ...formattedMessages.filter((m: any) => m.role !== 'system')];

    const result = streamText({
      model: provider.chat(selectedModel),
      messages: modelMessages,
      temperature,
      maxOutputTokens: 2000, // Reduced for faster responses
      async onChunk({ chunk }) {
        // Stream immediately without waiting for DB operations
      },
      onFinish: async ({ text }) => {
        // Run DB operations in background after streaming completes
        setImmediate(async () => {
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
        });
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

    // Handle validation errors
    if (error && error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.issues || [],
        success: false
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error?.message || 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Chat API (Multi-Provider Streaming) is running',
    timestamp: new Date().toISOString()
  });
}
