import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';
import { z } from 'zod';
import { withCSRFProtection } from '@/lib/csrfProtection';
import { LONGCAT_DEFAULT_MODEL } from '@/lib/longcatModels';
import { resolveChatProvider } from '@/lib/aiModels';
import { ensureUserAccount } from '@/lib/userAccount';
import { CreditsManager, type CreditPool } from '@/lib/credits';

// Auto-switch to Agnes (vision + search) when the latest message contains an
// image or clearly asks for live/search information.
const SEARCH_HINTS = [
  'search', 'look up', 'lookup', 'latest', 'current', 'today', 'right now',
  'news', 'weather', 'price of', 'stock', 'real-time', 'realtime', 'google',
  'find online', 'who won', 'score', 'recent',
]
function needsAgnes(messages: Array<{ role?: string; content?: unknown }>): boolean {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  if (!last) return false
  if (Array.isArray(last.content)) {
    if (last.content.some((p: any) => p?.type === 'image_url' || p?.type === 'image')) return true
    const text = last.content.map((p: any) => p?.text || '').join(' ').toLowerCase()
    return SEARCH_HINTS.some((h) => text.includes(h))
  }
  const text = String(last.content || '').toLowerCase()
  return SEARCH_HINTS.some((h) => text.includes(h))
}

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
    const [rateLimitResult, existingUser] = await Promise.all([
      rateLimit(userId, RATE_LIMITS.AI_ANALYSIS).catch(() => ({ success: true, message: '', resetTime: Date.now(), remaining: 100, limit: 100 })), // Fail open for max speed
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, aiCredits: true, agnesCredits: true, email: true, name: true, planType: true }
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
    // Auto-switch to Agnes for image (vision) or search-intent messages.
    const autoSwitched = needsAgnes(messages as any[]);
    const requestedModel = autoSwitched ? 'agnes-2.0-flash' : validated.model;
    const resolved = resolveChatProvider(requestedModel);
    const selectedModel = resolved.model;
    const pool: CreditPool = resolved.provider === 'agnes' ? 'agnes' : 'longcat';

    if (!resolved.apiKey) {
      return NextResponse.json(
        { error: `The selected AI model (${resolved.provider}) is not configured. Please add its API key.` },
        { status: 503 }
      );
    }

    const clerkUser = await currentUser().catch(() => null)
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || existingUser?.email || `${userId}@unknown.com`
    const name = clerkUser?.fullName || clerkUser?.firstName || existingUser?.name || 'User'
    const userDb = await ensureUserAccount({ userId, email, name }).catch(() => existingUser)

    if (!userDb) {
      return NextResponse.json(
        { error: 'Your account could not be loaded. Please refresh and try again.' },
        { status: 503 }
      );
    }

    // Check the balance of the pool this request will use.
    const effectiveCredits = (pool === 'agnes' ? (userDb as any)?.agnesCredits : userDb?.aiCredits) ?? 0

    if (effectiveCredits <= 0) {
      const label = pool === 'agnes' ? 'Agnes (search & vision)' : 'LongCat'
      return NextResponse.json(
        {
          error: `You're out of ${label} credits this month. Upgrade your plan to continue.`,
          pool,
          creditsRemaining: 0,
          upgradeUrl: '/subscription',
        },
        { status: 402 }
      );
    }

    const aiClient = createOpenAI({
      apiKey: resolved.apiKey,
      baseURL: resolved.baseURL,
    });
    const provider = aiClient.chat(selectedModel);

    const currentCredits = effectiveCredits;

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
You possess absolute, expert-level knowledge of everything related to AutoReview AI—our platform imports, manages, and automatically replies to reviews from Google, Yelp, Facebook, etc., and uses LongCat AI to save businesses hours of work daily. Our plans: Free ($0), Starter ($9/m), Growth ($19/m), Business ($39/m). Each AI response uses 1 credit.

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
      async onChunk(_chunk) {
        // Stream immediately without waiting for DB operations
      },
      onFinish: async ({ text }) => {
        // Run DB operations in background after streaming completes
        setImmediate(async () => {
          try {
            // Credit model: 1 credit = 1 AI response (atomic, concurrency-safe).
            // Deduct from the pool that served this request (LongCat or Agnes).
            const creditResult = await CreditsManager.useCredits(
              userDb.id,
              1,
              'chat_message',
              `Sarah AI chat (${pool})`,
              { sessionId, model: selectedModel, autoSwitched },
              pool
            );

            if (creditResult.success) {
              console.log(`[Chat API] Deducted 1 credit. Balance: ${creditResult.balanceAfter}`);
            } else {
              console.warn(`[Chat API] Credit deduction skipped: ${creditResult.error}`);
            }

            // Save assistant message to session
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
        'x-credits-remaining': Math.max(0, currentCredits - 1).toString(),
        'x-credit-pool': pool,
        'x-model-used': selectedModel,
        'x-auto-switched': autoSwitched ? '1' : '0',
        'x-credits-per-prompt': '1'
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

    // Sanitized: surface a helpful hint for key issues, otherwise generic.
    const raw = String(error?.message || '')
    return NextResponse.json({
      error: raw.includes('API key')
        ? 'AI provider rejected the request. Please verify the LongCat API key.'
        : 'An error occurred while processing your message. Please try again.',
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
