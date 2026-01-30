/**
 * LongCat AI Integration Service
 * Provides AI-powered review analysis and response generation
 */

const LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions";
const LONGCAT_API_KEY = "ak_13B7yT89Y6OX2O82DQ0h27yl3Zm7H";

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

export class LongCatAI {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string = LONGCAT_API_KEY, apiUrl: string = LONGCAT_API_URL) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  /**
   * Send a chat completion request to LongCat AI
   */
  async chat(
    messages: ChatMessage[],
    model: LongCatModel = "LongCat-Flash-Chat",
    options: {
      max_tokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    try {
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
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LongCat API error: ${response.status} - ${errorText}`);
      }

      const data: ChatCompletionResponse = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("LongCat AI Error:", error);
      throw error;
    }
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
      { temperature: 0.3 }
    );

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse sentiment analysis:", error);
      // Fallback analysis
      return {
        sentiment: "neutral",
        score: 0,
        confidence: 0.5,
        emotion: "uncertain",
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
    tone: "professional" | "friendly" | "apologetic" | "enthusiastic" = "friendly"
  ): Promise<{
    response: string;
    appropriateness_score: number;
  }> {
    const toneInstructions = {
      professional: "formal and professional, maintaining business etiquette",
      friendly: "warm and approachable, like talking to a friend",
      apologetic: "sincere and understanding, acknowledging concerns",
      enthusiastic: "energetic and grateful, showing genuine appreciation",
    };

    const prompt = `Generate a ${tone} response to this customer review.

Review Rating: ${rating}/5
Sentiment: ${sentiment}
Review: "${reviewText}"

Guidelines:
- Use a ${toneInstructions[tone]} tone
- Keep it concise (2-3 sentences)
- Address specific points mentioned in the review
- ${sentiment === "negative" ? "Show empathy and offer solutions" : "Thank them for their feedback"}
- ${rating >= 4 ? "Express gratitude" : "Show commitment to improvement"}
- Be authentic and personal, not robotic

Return a JSON object with:
- response: the generated response text
- appropriateness_score: a number between 0 and 1 indicating how appropriate this response is

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
      { temperature: 0.8 }
    );

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse review response:", error);
      return {
        response: "Thank you for your feedback! We truly appreciate you taking the time to share your experience with us.",
        appropriateness_score: 0.7,
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
      { temperature: 0.4, max_tokens: 1500 }
    );

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse deep analysis:", error);
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
      { temperature: 0.1, max_tokens: 100 }
    );

    try {
      return JSON.parse(response);
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
      { temperature: 0.5, max_tokens: 2000 }
    );

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse insights:", error);
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
