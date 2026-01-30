import { NextRequest, NextResponse } from 'next/server';
import { longcatAI, LongCatModel } from '@/lib/longcatAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'LongCat-Flash-Chat', temperature = 0.7, max_tokens = 2000 } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate model
    const validModels: LongCatModel[] = ['LongCat-Flash-Chat', 'LongCat-Flash-Thinking'];
    const selectedModel = validModels.includes(model as LongCatModel) 
      ? model as LongCatModel 
      : 'LongCat-Flash-Chat';

    console.log(`[Chat API] Using model: ${selectedModel}`);
    console.log(`[Chat API] Messages count: ${messages.length}`);

    // Format messages for LongCat AI
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }));

    // Call LongCat AI
    const response = await longcatAI.chat(
      formattedMessages,
      selectedModel,
      {
        temperature,
        max_tokens
      }
    );

    console.log(`[Chat API] Response received, length: ${response.length}`);

    return NextResponse.json({
      content: response,
      model: selectedModel,
      success: true
    });

  } catch (error: any) {
    console.error('[Chat API Error]:', error);
    
    // Return a fallback response instead of error
    return NextResponse.json({
      content: "I apologize, but I'm having trouble connecting to my AI brain right now. Please try again in a moment! If the problem persists, you can email us at support@autoreview-ai.com",
      model: 'fallback',
      error: error.message,
      success: false
    }, { status: 200 }); // Return 200 so frontend can show fallback message
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Chat API is running',
    models: ['LongCat-Flash-Chat', 'LongCat-Flash-Thinking'],
    timestamp: new Date().toISOString()
  });
}
