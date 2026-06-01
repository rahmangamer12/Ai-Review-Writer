import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';
import { z } from 'zod';
import { withCSRFProtection } from '@/lib/csrfProtection';
import { LONGCAT_DEFAULT_MODEL, normalizeLongCatModel } from '@/lib/longcatModels';

export const dynamic = 'force-dynamic'

// Input validation schema with proper types
const chatMessagePartSchema = z.object({
  type: z.enum(['text', 'image_url', 'image']),
  text: z.string().optional(),
  image_url: z.object({
    url: z.string().url()
  }).optional(),
  image: z.string().optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.union([z.string(), z.array(chatMessagePartSchema)])
  })).min(1),
  model: z.string().optional().default(LONGCAT_DEFAULT_MODEL),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().min(100).max(4000).optional(),
  fastMode: z.boolean().default(false)
});

async function handler(request: NextRequest) {
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

    // ULTRA-FAST OPTIMIZATION: Run Rate Limit and DB checks concurrently
    let [rateLimitResult, userDb] = await Promise.all([
      rateLimit(userId, RATE_LIMITS.AI_ANALYSIS).catch(() => ({ success: true, message: '', resetTime: Date.now(), remaining: 100, limit: 100 })), // Fail open for max speed
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, aiCredits: true, promptCount: true }
      }).catch(() => null)
    ])

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

    // Validate input immediately
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);

    const { messages, temperature, max_tokens: requestedMaxTokens, fastMode } = validated;
    const selectedModel = normalizeLongCatModel(validated.model);

    if (!process.env.LONGCAT_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI models are currently unavailable. Please check your API key.' },
        { status: 503 }
      );
    }

    if (!userDb) {
      const clerkUser = await currentUser().catch(() => null)
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@unknown.com`
      const name = clerkUser?.fullName || clerkUser?.firstName || 'User'
      const existingByEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null)
      userDb = existingByEmail
        ? { id: existingByEmail.id, aiCredits: existingByEmail.aiCredits, promptCount: existingByEmail.promptCount }
        : await prisma.user.create({
            data: { id: userId, email, name, planType: 'free', aiCredits: 20, promptCount: 0, maxPlatforms: 1 },
            select: { id: true, aiCredits: true, promptCount: true },
          }).catch(() => null)
    }

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

    const longcat = createOpenAI({
      apiKey: process.env.LONGCAT_AI_API_KEY,
      baseURL: 'https://api.longcat.chat/openai/v1',
    });
    const provider = longcat.chat(selectedModel);

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

Current server date/time: ${new Date().toISOString()}.

CRITICAL INSTRUCTIONS FOR YOU:
1. You are a God-Tier general purpose AI as well. If the user asks ANY question—whether it be coding, general knowledge, math, science, philosophy, or writing—you MUST answer it perfectly and enthusiastically. NEVER say "I only answer questions about AutoReview AI."
2. Always maintain a warm, helpful, and highly intelligent persona. Use emojis occasionally.
3. Be transparent, direct, and incredibly thorough. Give the most informative and accurate answers possible!
4. IMPORTANT: If the user asks for the current date, time, today, or live temporal information, answer using the current server date/time above.
5. Always respond in the exact language the user queries you in.`
    };

    const modelMessages = [godTierPrompt, ...formattedMessages.filter((m: any) => m.role !== 'system')];
    const defaultMaxOutputTokens = 1400;
    const maxOutputTokens = Math.min(
      requestedMaxTokens ?? defaultMaxOutputTokens,
      fastMode ? 700 : defaultMaxOutputTokens
    );

    const result = streamText({
      model: provider,
      messages: modelMessages,
      temperature,
      maxOutputTokens,
      async onChunk({ chunk }) {
        // Stream immediately without waiting for DB operations
      },
      onFinish: async ({ text }) => {
        // Run DB operations in background after streaming completes
        setImmediate(async () => {
          try {
            const nextPromptCount = currentPromptCount + 1;
            
            // Use atomic transaction to prevent race conditions
            if (nextPromptCount >= 10) {
              await prisma.$transaction([
                prisma.user.update({
                  where: { id: userDb.id },
                  data: { aiCredits: { decrement: 1 }, promptCount: 0 }
                })
              ]);
            } else {
              await prisma.$transaction([
                prisma.user.update({
                  where: { id: userDb.id },
                  data: { promptCount: { increment: 1 } }
                })
              ]);
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
            console.error('[Chat API] Database error:', dbErr);
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

    const message = String(error?.message || 'An error occurred. Please try again.')
    return NextResponse.json({
      error: message.includes('API key')
        ? 'AI provider rejected the request. Please verify the LongCat API key in Vercel.'
        : message,
      success: false
    }, { status: 500 });
  }
}

export const POST = withCSRFProtection(handler);

export async function GET() {
  return NextResponse.json({ 
    status: 'Chat API (Multi-Provider Streaming) is running',
    timestamp: new Date().toISOString()
  });
}
