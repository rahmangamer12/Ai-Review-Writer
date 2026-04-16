import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit';
import { z } from 'zod';

export const dynamic = 'force-dynamic'

// Configure LongCat as a custom OpenAI provider
const longcat = createOpenAI({
  apiKey: process.env.LONGCAT_AI_API_KEY || 'dummy_key',
  baseURL: 'https://api.longcat.chat/openai/v1',
});

// Configure Google Generative AI (Free Tier Multimodal Model)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'dummy_key',
});

// Allowed models for security
const ALLOWED_MODELS = [
  'LongCat-Flash-Chat',
  'LongCat-Flash-Thinking',
  'LongCat-Flash-Thinking-2601',
  'LongCat-Flash-Lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
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

    // ULTRA-FAST OPTIMIZATION: Run Rate Limit and DB checks concurrently
    const [rateLimitResult, userDb] = await Promise.all([
      rateLimit(userId, RATE_LIMITS.AI_ANALYSIS).catch(() => ({ success: true, message: '', resetTime: Date.now(), remaining: 100, limit: 100 })), // Fail open for max speed
      (prisma.user as any).findUnique({
        where: { id: userId },
        select: { aiCredits: true, promptCount: true }
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

    const { messages, model: selectedModel, temperature } = validated;

    // Check if LongCat or Google is available depending on model
    if (selectedModel.startsWith('gemini') && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google Gemini models are currently unavailable. Please check your API key.' },
        { status: 503 }
      );
    }
    if (!selectedModel.startsWith('gemini') && !process.env.LONGCAT_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI models are currently unavailable. Please check your API key.' },
        { status: 503 }
      );
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

    const provider = selectedModel.startsWith('gemini') 
      ? google(selectedModel) 
      : longcat.chat(selectedModel);

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
      model: provider,
      messages: modelMessages,
      temperature,
      maxOutputTokens: 2000, // Reduced for faster responses
      tools: {
        getCurrentTime: tool({
          description: 'Get the exact current date, time, and timezone. Call this when the user asks for the time, date, today, or live time info.',
          parameters: z.object({
            location: z.string().optional().describe('Optional specific location or timezone, otherwise returns system time')
          }),
          execute: async ({ location }) => {
            const date = new Date();
            return {
              time: date.toLocaleTimeString(),
              date: date.toLocaleDateString(),
              zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              iso: date.toISOString()
            };
          },
        }),
        searchWeb: tool({
          description: 'Search Wikipedia for live real-time information, facts, definitions, and news. Call this when the user asks a question about the real world, events, people, places, or any general knowledge that requires searching.',
          parameters: z.object({
            query: z.string().describe('The search query or keyword to find on Wikipedia.')
          }),
          execute: async ({ query }) => {
            try {
              const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
              const data = await res.json();
              if (data.query && data.query.search && data.query.search.length > 0) {
                return data.query.search.slice(0, 3).map((item: any) => ({
                  title: item.title,
                  snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, "") // Clean HTML tags
                }));
              }
              return { error: 'No results found on Wikipedia.' };
            } catch (err) {
              return { error: 'Search failed.' };
            }
          }
        })
      },
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

    return NextResponse.json({
      error: 'An error occurred. Please try again.',
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
