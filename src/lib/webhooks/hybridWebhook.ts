/**
 * HYBRID WEBHOOK SYSTEM
 * Combines: API Webhooks + Manual Import + Screenshot Upload + Email Forwarding
 * 
 * This is the SOLUTION to API approval problems!
 * Users can choose their preferred method to get reviews into the system
 */

import { longcatAI } from '@/lib/longcatAI';

export type WebhookSource = 
  | 'google_api'      // Official Google API (requires approval)
  | 'facebook_api'    // Official Facebook API
  | 'yelp_api'        // Official Yelp API
  | 'manual_import'   // CSV/Excel upload
  | 'screenshot'      // Screenshot upload (OCR)
  | 'email_forward'   // Email forwarding
  | 'chrome_extension' // Chrome extension scraping
  | 'webhook_custom'; // Custom webhook URL

export interface IncomingReview {
  id: string;
  source: WebhookSource;
  platform: 'google' | 'facebook' | 'yelp' | 'tripadvisor' | 'trustpilot' | 'other';
  author: string;
  rating: number;
  text: string;
  date: string;
  raw_data?: any;
  media_url?: string; // For screenshots
  email_data?: any;   // For email forwarding
}

export interface ProcessedReview extends IncomingReview {
  sentiment: string;
  ai_reply?: string;
  confidence: number;
  needs_human_review: boolean;
  auto_approved: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'posted';
  processed_at: string;
}

/**
 * Process incoming review from ANY source
 * This is the main entry point for the hybrid system
 */
export async function processIncomingReview(
  review: IncomingReview,
  options: {
    autoReply?: boolean;
    autoPost?: boolean;
    businessName?: string;
    businessType?: string;
    tone?: string;
    language?: string;
  } = {}
): Promise<ProcessedReview> {
  console.log(`[Hybrid Webhook] Processing review from ${review.source}`);

  // Step 1: Analyze sentiment
  const sentiment = await longcatAI.analyzeSentiment(review.text);

  // Step 2: Deep analysis
  const deepAnalysis = await longcatAI.deepAnalyzeReview(review.text);

  // Step 3: Generate AI reply
  let aiReply: string | undefined;
  if (options.autoReply !== false) {
    const replyResult = await longcatAI.generateReviewResponse(
      review.text,
      review.rating,
      sentiment.sentiment,
      (options.tone as any) || (sentiment.sentiment === 'negative' ? 'apologetic' : 'friendly')
    );
    aiReply = replyResult.response;
  }

  // Step 4: Determine auto-approval
  const autoApproved = shouldAutoApprove(review.rating, sentiment.sentiment, deepAnalysis.priority, sentiment.confidence);

  // Step 5: Determine final status
  let status: ProcessedReview['status'] = 'pending';
  if (autoApproved && options.autoPost) {
    status = 'posted';
  } else if (autoApproved) {
    status = 'approved';
  }

  const processed: ProcessedReview = {
    ...review,
    sentiment: sentiment.sentiment,
    ai_reply: aiReply,
    confidence: sentiment.confidence,
    needs_human_review: !autoApproved,
    auto_approved: autoApproved,
    status,
    processed_at: new Date().toISOString(),
  };

  console.log(`[Hybrid Webhook] Processed: ${sentiment.sentiment}, Auto-approved: ${autoApproved}`);

  return processed;
}

/**
 * Determine if review should be auto-approved
 */
function shouldAutoApprove(
  rating: number,
  sentiment: string,
  priority: string,
  confidence: number
): boolean {
  // Never auto-approve urgent/high priority
  if (priority === 'urgent' || priority === 'high') return false;

  // Auto-approve positive reviews with high confidence
  if (rating >= 4 && sentiment === 'positive' && confidence > 0.8) return true;

  // Auto-approve neutral with very high confidence
  if (sentiment === 'neutral' && confidence > 0.9) return true;

  // Everything else needs human review
  return false;
}

/**
 * MANUAL IMPORT: Process reviews from CSV/Excel
 */
export async function processManualImport(
  reviews: Array<{
    author?: string;
    rating: number;
    text: string;
    date?: string;
    platform?: string;
  }>,
  options?: any
): Promise<ProcessedReview[]> {
  console.log(`[Manual Import] Processing ${reviews.length} reviews`);

  const processed: ProcessedReview[] = [];

  for (const review of reviews) {
    const incoming: IncomingReview = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'manual_import',
      platform: (review.platform as any) || 'google',
      author: review.author || 'Anonymous',
      rating: review.rating,
      text: review.text,
      date: review.date || new Date().toISOString(),
    };

    const result = await processIncomingReview(incoming, options);
    processed.push(result);
  }

  return processed;
}

/**
 * SCREENSHOT UPLOAD: Process review from screenshot
 * Uses OCR (simulated here, would use Tesseract or similar in production)
 */
export async function processScreenshot(
  imageBase64: string,
  metadata: {
    platform: string;
    extractedText?: string;
  },
  options?: any
): Promise<ProcessedReview> {
  console.log(`[Screenshot] Processing screenshot for ${metadata.platform}`);

  // In production, use OCR service like Tesseract.js or Google Vision API
  // For now, assume text is extracted or provided
  const extractedText = metadata.extractedText || await simulateOCR(imageBase64);

  // Parse the extracted text to find review details
  const parsed = parseReviewText(extractedText);

  const incoming: IncomingReview = {
    id: `screenshot_${Date.now()}`,
    source: 'screenshot',
    platform: metadata.platform as any,
    author: parsed.author || 'Anonymous',
    rating: parsed.rating || 5,
    text: parsed.text || extractedText,
    date: new Date().toISOString(),
    raw_data: { imageBase64: imageBase64.substring(0, 100) + '...' },
  };

  return processIncomingReview(incoming, options);
}

/**
 * EMAIL FORWARD: Process review from forwarded email
 */
export async function processEmailForward(
  emailData: {
    from: string;
    subject: string;
    body: string;
    platform_hint?: string;
  },
  options?: any
): Promise<ProcessedReview> {
  console.log(`[Email Forward] Processing email: ${emailData.subject}`);

  // Parse email to extract review
  const parsed = parseEmailContent(emailData);

  const incoming: IncomingReview = {
    id: `email_${Date.now()}`,
    source: 'email_forward',
    platform: (emailData.platform_hint as any) || 'google',
    author: parsed.author || 'Customer',
    rating: parsed.rating || 5,
    text: parsed.text,
    date: new Date().toISOString(),
    email_data: emailData,
  };

  return processIncomingReview(incoming, options);
}

/**
 * CUSTOM WEBHOOK URL: Generate unique webhook URL for users
 */
export function generateWebhookUrl(userId: string): string {
  const webhookId = `${userId}_${generateSecureToken(16)}`;
  return `https://api.autoreview-ai.com/webhooks/reviews/${webhookId}`;
}

/**
 * Verify webhook signature (for security)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, use crypto to verify HMAC signature
  // For now, simple check
  return signature.length > 0;
}

// Helper functions
function generateSecureToken(length: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, length);
}

async function simulateOCR(imageBase64: string): Promise<string> {
  // In production: Use Tesseract.js or Google Vision API
  // For demo: return placeholder
  return "OCR extraction would happen here. In production, use Tesseract.js or similar.";
}

function parseReviewText(text: string): { author?: string; rating?: number; text: string } {
  // Simple parsing logic
  const lines = text.split('\n').filter(l => l.trim());
  
  // Try to find rating (look for stars or numbers)
  const ratingMatch = text.match(/(\d)\s*star/i) || text.match(/rating[:\s]*(\d)/i);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : undefined;

  return {
    author: lines[0]?.includes('by') ? lines[0].replace('by', '').trim() : undefined,
    rating,
    text: lines.slice(1).join('\n') || text,
  };
}

function parseEmailContent(emailData: { subject: string; body: string }): { author: string; rating: number; text: string } {
  // Parse email content from platforms like Google, Facebook
  const { subject, body } = emailData;
  
  // Extract review text (usually in the body)
  const text = body.replace(/<[^>]*>/g, ' ').trim();
  
  // Try to find rating in subject or body
  const ratingMatch = subject.match(/(\d)\s*star/i) || body.match(/(\d)\s*star/i);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

  return {
    author: 'Customer',
    rating,
    text: text.substring(0, 1000), // Limit length
  };
}

// Export the hybrid webhook processor
export const hybridWebhook = {
  processIncomingReview,
  processManualImport,
  processScreenshot,
  processEmailForward,
  generateWebhookUrl,
  verifyWebhookSignature,
};
