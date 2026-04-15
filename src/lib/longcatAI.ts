/**
 * LongCat AI Integration Service
 * Provides AI-powered review analysis and response generation
 *
 * SECURITY NOTE: This client-side service should NOT contain API keys.
 * All AI processing should be done through API routes for security.
 */

const LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions";

// Get API key from environment variable - ONLY for server-side use
const getApiKey = () => {
  // Only access API key in server context
  if (typeof window !== 'undefined') {
    console.warn('Warning: Attempting to access API key from client-side code');
    return '';
  }

  if (typeof process !== 'undefined' && process.env) {
    return process.env.LONGCAT_AI_API_KEY || '';
  }
  return '';
};

export type LongCatModel =
  | "LongCat-Flash-Chat"
  | "LongCat-Flash-Thinking"
  | "LongCat-Flash-Thinking-2601"
  | "LongCat-Flash-Lite";
  // | "LongCat-Flash-Omni-2603"; // Disabled - API returns "json format error"

export interface ChatMessageContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string, detail?: "auto" | "low" | "high" };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatMessageContentPart[];
}

interface ChatCompletionRequest {
  model: LongCatModel;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Circuit breaker implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly timeoutMs = 60000; // 1 minute

  public async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public isOpen() {
    return this.state === 'OPEN';
  }

  public getFailureCount() {
    return this.failureCount;
  }
}

export class LongCatAI {
  private apiKey: string;
  private apiUrl: string;
  private circuitBreaker: CircuitBreaker;

  constructor(apiKey?: string, apiUrl: string = LONGCAT_API_URL) {
    this.apiKey = apiKey || getApiKey();
    this.apiUrl = apiUrl;
    this.circuitBreaker = new CircuitBreaker();
  }

  // Always read fresh from env (in case of Next.js module caching)
  private getFreshApiKey(): string {
    return process.env.LONGCAT_AI_API_KEY || this.apiKey || '';
  }

  // Reset circuit breaker - useful when API key is updated
  public resetCircuitBreaker(): void {
    this.circuitBreaker = new CircuitBreaker();
  }

  // Check if API key is configured
  public hasApiKey(): boolean {
    const key = this.getFreshApiKey();
    return !!key && key.length > 0;
  }

  /**
   * Send a chat completion request to LongCat AI with retry and circuit breaker
   */
  async chat(
    messages: ChatMessage[],
    model: LongCatModel = "LongCat-Flash-Chat",
    options: {
      max_tokens?: number;
      temperature?: number;
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<string> {
    // Check if API key is configured
    if (!this.hasApiKey()) {
      throw new Error('AI service is not configured. Please add your LONGCAT_AI_API_KEY to the .env file.');
    }

    // Check if circuit breaker is open
    if (this.circuitBreaker.isOpen()) {
      throw new Error('AI service is temporarily unavailable (Circuit Breaker Open). Please try again in a few minutes.');
    }

    const maxRetries = options.retries ?? 3;
    const timeoutMs = options.timeout ?? 30000; // 30 seconds default timeout

    // Function to make the API call with timeout
    const makeCall = async (): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const currentApiKey = this.getFreshApiKey();

      try {
        if (!currentApiKey) {
          throw new Error('AI service is not configured.');
        }

        const requestBody = {
          model,
          messages,
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7,
        };
        


        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody as ChatCompletionRequest),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[LongCat] API error:', response.status, errorText);
          throw new Error(`LongCat API error: ${response.status} - ${errorText}`);
        }

        const data: ChatCompletionResponse = await response.json();
        const content = data.choices[0]?.message?.content || "";

        return content;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Execute with circuit breaker and retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.circuitBreaker.call(makeCall);
      } catch (error) {
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with 10s max
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Analyze sentiment of a review
   */
  async analyzeSentiment(reviewText: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    confidence: number;
    emotion: string;
    topics: string[];
  }> {
    try {
      const prompt = `Analyze the sentiment of this customer review and provide a detailed analysis.

Review: "${reviewText}"

Provide your analysis in JSON format with the following fields:
- sentiment: "positive", "negative", or "neutral"
- score: a number between -1 (very negative) and 1 (very positive)
- confidence: a number between 0 and 1 indicating confidence in the analysis
- emotion: the primary emotion detected (e.g., "happy", "angry", "disappointed", "excited", "satisfied")
- topics: an array of key topics mentioned in the review

Return ONLY the JSON object, no additional text.`;

      const response = await this.chat(
        [
          {
            role: "system",
            content: "You are an expert sentiment analysis AI. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "LongCat-Flash-Chat",
        { temperature: 0.3, retries: 2 }
      );

      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error("[LongCat] Failed to parse sentiment analysis JSON:", error);
        throw new Error('Failed to parse AI sentiment analysis response.');
      }
    } catch (error) {
      console.error("[LongCat] Sentiment analysis error:", error);
      throw error;
    }
  }

  /**
   * Generate a response to a customer review
   */
  async generateReviewResponse(
    reviewText: string,
    rating: number,
    sentiment: string,
    tone: "professional" | "friendly" | "apologetic" | "enthusiastic" = "friendly",
    authorName: string = "there"
  ): Promise<{
    response: string;
    appropriateness_score: number;
  }> {
    try {
      const toneInstructions = {
        professional: "formal and professional, maintaining business etiquette",
        friendly: "warm and approachable, like talking to a friend",
        apologetic: "sincere and understanding, acknowledging concerns",
        enthusiastic: "energetic and grateful, showing genuine appreciation",
      };

      const prompt = `Generate a ${tone} response to this customer review.

Review Rating: ${rating}/5
Sentiment: ${sentiment}
Customer Name: ${authorName}
Review: "${reviewText}"

Guidelines:
- Use a ${toneInstructions[tone]} tone
- Keep it concise (2-4 sentences)
- Address specific points mentioned in the review
- ${sentiment === "negative" ? "Show empathy and offer solutions" : "Thank them for their feedback"}
- ${rating >= 4 ? "Express gratitude" : "Show commitment to improvement"}
- Be authentic and personal, not robotic
- Address the customer by name if provided

Return a JSON object with:
- response: the generated response text (just the reply, no quotes or labels)
- appropriateness_score: a number between 0 and 1

Return ONLY the JSON object.`;

      const response = await this.chat(
        [
          {
            role: "system",
            content: "You are an expert customer service AI. Generate thoughtful, personalized responses to customer reviews. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "LongCat-Flash-Chat",
        { temperature: 0.8, retries: 2 }
      );

      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          response: parsed.response || parsed.reply || parsed.message || parsed.text,
          appropriateness_score: parsed.appropriateness_score || 0.8,
        };
      } catch (error) {
        console.error("[LongCat] Failed to parse review response JSON:", error);
        throw new Error('Failed to generate a valid AI response for the review.');
      }
    } catch (error) {
      console.error("[LongCat] Generate response error:", error);
      throw error;
    }
  }

  /**
   * Generate a realistic review for testing
   */
  async generateTestReview(
    platform: string,
    rating: number,
    businessType: string = "restaurant"
  ): Promise<{
    content: string;
    sentiment: string;
    author_name: string;
    ai_reply: string;
  }> {
    try {
      const prompt = `Generate a realistic ${rating}-star customer review for a ${businessType} on ${platform}.

The review should:
- Be 1-3 sentences
- Sound authentic like a real customer
- Mention specific details about the experience
- Match the ${rating}-star sentiment

Also generate:
- A realistic customer first and last name
- An appropriate business response from the owner

Return ONLY a JSON object with:
- content: the review text
- sentiment: "positive", "neutral", or "negative"
- author_name: full name
- ai_reply: the business owner's response`;

      const response = await this.chat(
        [
          {
            role: "system",
            content: "You are a realistic review generator. Create authentic-sounding customer reviews for businesses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "LongCat-Flash-Chat",
        { temperature: 0.9, max_tokens: 500, retries: 1 }
      );

      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error("[LongCat] Failed to parse test review JSON:", error);
        throw new Error('Failed to generate a valid test review.');
      }
    } catch (error) {
      console.error("[LongCat] Generate test review error:", error);
      throw error;
    }
  }

  /**
   * Deep thinking analysis for complex reviews
   */
  async deepAnalyzeReview(reviewText: string): Promise<{
    key_insights: string[];
    action_items: string[];
    customer_intent: string;
    priority: "low" | "medium" | "high" | "urgent";
    recommended_response_strategy: string;
  }> {
    try {
      const prompt = `Perform a deep analysis of this customer review to understand the underlying intent, concerns, and required actions.

Review: "${reviewText}"

Analyze:
1. What are the key insights from this review?
2. What specific action items should the business take?
3. What is the customer's underlying intent or need?
4. What priority level should this review have?
5. What response strategy would be most effective?

Return a JSON object with:
- key_insights: array of key insights
- action_items: array of specific actions the business should take
- customer_intent: the underlying intent or need
- priority: "low", "medium", "high", or "urgent"
- recommended_response_strategy: description of the best approach

Return ONLY the JSON object.`;

      const response = await this.chat(
        [
          {
            role: "system",
            content: "You are an expert business analyst with deep understanding of customer psychology and business operations. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "LongCat-Flash-Thinking",
        { temperature: 0.4, max_tokens: 1500, retries: 2 }
      );

      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error("[LongCat] Failed to parse deep analysis JSON:", error);
        throw new Error('Failed to perform deep analysis on the review.');
      }
    } catch (error) {
      console.error("[LongCat] Deep analysis error:", error);
      throw error;
    }
  }

  /**
   * Detect language of the review
   */
  async detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
  }> {
    try {
      const prompt = `Detect the language of this text: "${text}"

Return a JSON object with:
- language: the ISO 639-1 language code (e.g., "en", "es", "fr")
- confidence: a number between 0 and 1

Return ONLY the JSON object.`;

      const response = await this.chat(
        [
          {
            role: "system",
            content: "You are a language detection AI. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "LongCat-Flash-Chat",
        { temperature: 0.1, max_tokens: 100, retries: 1 }
      );

      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        return { language: "en", confidence: 0.5 };
      }
    } catch (error) {
      return { language: "en", confidence: 0.5 };
    }
  }

  /**
   * Generate insights from multiple reviews
   */
  async generateInsights(reviews: Array<{ text: string; rating: number; date: string }>): Promise<{
    overall_trends: string[];
    common_praises: string[];
    common_complaints: string[];
    improvement_suggestions: string[];
    summary: string;
  }> {
    // Check if API key is configured
    if (!this.hasApiKey()) {
      throw new Error('AI Insights are unavailable because the API key is not configured.');
    }

    try {
      const reviewsSummary = reviews.slice(0, 20).map((r, i) =>
        `${i + 1}. Rating: ${r.rating}/5 - ${r.text}`
      ).join("\n");

      const prompt = `Analyze these customer reviews and provide actionable insights:

${reviewsSummary}

Provide a comprehensive analysis with:
- overall_trends: key trends across all reviews
- common_praises: what customers consistently appreciate
- common_complaints: recurring issues or complaints
- improvement_suggestions: specific recommendations for improvement
- summary: a brief executive summary

Return ONLY a JSON object with these fields.`;

      const response = await this.chat(
        [
          {
            role: "system",
            content: "You are a business intelligence analyst specializing in customer feedback analysis. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        "LongCat-Flash-Thinking",
        { temperature: 0.5, max_tokens: 2000, retries: 2 }
      );

      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error("[LongCat] Failed to parse insights JSON:", error);
        throw new Error('Failed to generate business insights from reviews.');
      }
    } catch (error) {
      console.error("[LongCat] Insights error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const longcatAI = new LongCatAI();
