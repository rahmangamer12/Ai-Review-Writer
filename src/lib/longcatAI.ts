/**
 * LongCat AI Integration Service
 * Provides AI-powered review analysis and response generation
 */

const LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions";

// Get API key from environment variable
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.LONGCAT_AI_API_KEY || '';
  }
  return '';
};

export type LongCatModel = "LongCat-Flash-Chat" | "LongCat-Flash-Thinking";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
    // Check if circuit breaker is open
    if (this.circuitBreaker.isOpen()) {
      console.warn('[LongCat] Circuit breaker is open, using fallback response');
      throw new Error('LongCat service is temporarily unavailable (circuit breaker open)');
    }

    const maxRetries = options.retries ?? 3;
    const timeoutMs = options.timeout ?? 30000; // 30 seconds default timeout

    // Function to make the API call with timeout
    const makeCall = async (): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (!this.apiKey) {
          console.warn('[LongCat] No API key found, using fallback responses');
          throw new Error('No API key configured');
        }

        console.log('[LongCat] Sending request with model:', model);

        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature || 0.7,
          } as ChatCompletionRequest),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[LongCat] API error:', response.status, errorText);
          throw new Error(`LongCat API error: ${response.status} - ${errorText}`);
        }

        const data: ChatCompletionResponse = await response.json();
        const content = data.choices[0]?.message?.content || "";

        console.log('[LongCat] Response received:', content.substring(0, 100) + '...');

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
        console.error(`[LongCat] Attempt ${attempt + 1} failed:`, error);

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
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
        console.error("[LongCat] Failed to parse sentiment analysis:", error);
        // Fallback based on rating keywords
        const lower = reviewText.toLowerCase();
        if (lower.includes('great') || lower.includes('amazing') || lower.includes('excellent') || lower.includes('love')) {
          return { sentiment: "positive", score: 0.8, confidence: 0.9, emotion: "happy", topics: [] };
        } else if (lower.includes('bad') || lower.includes('terrible') || lower.includes('worst') || lower.includes('hate')) {
          return { sentiment: "negative", score: -0.8, confidence: 0.9, emotion: "angry", topics: [] };
        }
        return { sentiment: "neutral", score: 0, confidence: 0.5, emotion: "neutral", topics: [] };
      }
    } catch (error) {
      console.error("[LongCat] Sentiment analysis error:", error);
      // Return a default sentiment when the API is unavailable
      return {
        sentiment: "neutral",
        score: 0,
        confidence: 0.5,
        emotion: "neutral",
        topics: [],
      };
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
          response: parsed.response || parsed.reply || parsed.message || parsed.text || "Thank you for your feedback!",
          appropriateness_score: parsed.appropriateness_score || 0.8,
        };
      } catch (error) {
        console.error("[LongCat] Failed to parse review response:", error);
        // Return the raw response if it's not valid JSON
        return {
          response: response.replace(/[{}"]/g, '').replace(/response:|reply:/, '').trim() || "Thank you for your feedback!",
          appropriateness_score: 0.7,
        };
      }
    } catch (error) {
      console.error("[LongCat] Generate response error:", error);
      // Fallback responses
      if (rating >= 4) {
        return {
          response: `Thank you ${authorName} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!`,
          appropriateness_score: 0.9,
        };
      } else if (rating === 3) {
        return {
          response: `Thank you ${authorName} for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.`,
          appropriateness_score: 0.8,
        };
      } else {
        return {
          response: `Hi ${authorName}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.`,
          appropriateness_score: 0.85,
        };
      }
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
        // Fallback templates
        const names = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown'];
        const templates: Record<number, string[]> = {
          5: [
            'Absolutely amazing experience! The service was top-notch and exceeded all my expectations.',
            'Highly recommend! Great quality and friendly staff. Will definitely come back.',
            'Outstanding! Everything was perfect from start to finish.',
          ],
          4: [
            'Great experience overall. Minor improvements could be made but very satisfied.',
            'Really enjoyed my visit. Good service and quality.',
          ],
          3: [
            'It was okay. Nothing special but met my basic expectations.',
            'Average experience. Some good points but room for improvement.',
          ],
          2: [
            'Below average experience. Had some issues during my visit.',
            'Not what I expected. Disappointed with several aspects.',
          ],
          1: [
            'Very disappointed with the experience. Would not recommend.',
            'Terrible service and quality. Expected much better.',
          ],
        };

        const content = templates[rating]?.[0] || 'Average experience.';
        const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';

        return {
          content,
          sentiment,
          author_name: names[Math.floor(Math.random() * names.length)],
          ai_reply: 'Thank you for your feedback! We appreciate your review.',
        };
      }
    } catch (error) {
      console.error("[LongCat] Generate test review error:", error);
      return {
        content: 'Great experience! Would recommend to others.',
        sentiment: 'positive',
        author_name: 'John Smith',
        ai_reply: 'Thank you for your wonderful review!',
      };
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
        console.error("[LongCat] Failed to parse deep analysis:", error);
        return {
          key_insights: ["Review requires manual analysis"],
          action_items: ["Review manually"],
          customer_intent: "Unknown",
          priority: "medium",
          recommended_response_strategy: "Standard response",
        };
      }
    } catch (error) {
      console.error("[LongCat] Deep analysis error:", error);
      return {
        key_insights: ["Review requires manual analysis"],
        action_items: ["Review manually"],
        customer_intent: "Unknown",
        priority: "medium",
        recommended_response_strategy: "Standard response",
      };
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
        console.error("[LongCat] Failed to parse insights:", error);
        return {
          overall_trends: [],
          common_praises: [],
          common_complaints: [],
          improvement_suggestions: [],
          summary: "Unable to generate insights at this time.",
        };
      }
    } catch (error) {
      console.error("[LongCat] Insights error:", error);
      return {
        overall_trends: [],
        common_praises: [],
        common_complaints: [],
        improvement_suggestions: [],
        summary: "Unable to generate insights at this time.",
      };
    }
  }
}

// Export singleton instance
export const longcatAI = new LongCatAI();
