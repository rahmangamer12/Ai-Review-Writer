/**
 * AUTO-REPLY SCHEDULER
 * Handles scheduled and automatic replies to reviews
 */

import { longcatAI } from '@/lib/longcatAI';

export interface ScheduledReply {
  id: string;
  reviewId: string;
  platform: string;
  replyText: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  autoPost: boolean;
  createdAt: Date;
}

export interface AutoReplyRule {
  id: string;
  name: string;
  conditions: {
    minRating?: number;
    maxRating?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
    keywords?: string[];
    platforms?: string[];
  };
  actions: {
    autoGenerate: boolean;
    autoApprove: boolean;
    autoPost: boolean;
    tone?: string;
    template?: string;
    delayMinutes?: number;
  };
  isActive: boolean;
}

// In-memory store (use Redis/DB in production)
const scheduledReplies: Map<string, ScheduledReply> = new Map();
const autoReplyRules: Map<string, AutoReplyRule> = new Map();

/**
 * Create default auto-reply rules
 */
export function createDefaultRules(): AutoReplyRule[] {
  const rules: AutoReplyRule[] = [
    {
      id: 'rule_positive_5star',
      name: '5-Star Auto Reply',
      conditions: {
        minRating: 5,
        sentiment: 'positive',
      },
      actions: {
        autoGenerate: true,
        autoApprove: true,
        autoPost: true,
        tone: 'enthusiastic',
        delayMinutes: 0,
      },
      isActive: false, // User must enable
    },
    {
      id: 'rule_positive_4star',
      name: '4-Star Auto Reply',
      conditions: {
        minRating: 4,
        maxRating: 4,
        sentiment: 'positive',
      },
      actions: {
        autoGenerate: true,
        autoApprove: true,
        autoPost: false, // Queue for approval
        tone: 'friendly',
        delayMinutes: 30,
      },
      isActive: false,
    },
    {
      id: 'rule_negative_alert',
      name: 'Negative Review Alert',
      conditions: {
        maxRating: 2,
        sentiment: 'negative',
      },
      actions: {
        autoGenerate: true,
        autoApprove: false,
        autoPost: false,
        tone: 'apologetic',
        delayMinutes: 0,
      },
      isActive: true, // Always active for alerts
    },
  ];

  rules.forEach(rule => autoReplyRules.set(rule.id, rule));
  return rules;
}

/**
 * Check if review matches a rule
 */
export function matchesRule(review: any, rule: AutoReplyRule): boolean {
  const { conditions } = rule;

  // Check rating
  if (conditions.minRating !== undefined && review.rating < conditions.minRating) {
    return false;
  }
  if (conditions.maxRating !== undefined && review.rating > conditions.maxRating) {
    return false;
  }

  // Check sentiment
  if (conditions.sentiment && review.sentiment !== conditions.sentiment) {
    return false;
  }

  // Check keywords
  if (conditions.keywords && conditions.keywords.length > 0) {
    const reviewText = (review.text || '').toLowerCase();
    const hasKeyword = conditions.keywords.some(kw => reviewText.includes(kw.toLowerCase()));
    if (!hasKeyword) return false;
  }

  // Check platforms
  if (conditions.platforms && conditions.platforms.length > 0) {
    if (!conditions.platforms.includes(review.platform)) {
      return false;
    }
  }

  return true;
}

/**
 * Process a review against all active rules
 */
export async function processReviewWithRules(
  review: any,
  userSettings: any = {}
): Promise<{ matched: boolean; action?: any; scheduledReply?: ScheduledReply }> {
  console.log(`[Auto Reply] Processing review ${review.id} against rules`);

  // Get all active rules
  const activeRules = Array.from(autoReplyRules.values()).filter(r => r.isActive);

  for (const rule of activeRules) {
    if (matchesRule(review, rule)) {
      console.log(`[Auto Reply] Matched rule: ${rule.name}`);

      const action = rule.actions;

      // Generate reply if needed
      let replyText = action.template || '';
      if (action.autoGenerate && !replyText) {
        const aiResponse = await longcatAI.generateReviewResponse(
          review.text,
          review.rating,
          review.sentiment || 'neutral',
          (action.tone as any) || 'friendly'
        );
        replyText = aiResponse.response;
      }

      // Schedule or queue the reply
      const scheduledReply: ScheduledReply = {
        id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewId: review.id,
        platform: review.platform,
        replyText,
        scheduledFor: new Date(Date.now() + (action.delayMinutes || 0) * 60000),
        status: action.autoPost ? 'pending' : 'pending',
        autoPost: action.autoPost,
        createdAt: new Date(),
      };

      scheduledReplies.set(scheduledReply.id, scheduledReply);

      // If auto-post and approved, execute immediately
      if (action.autoPost && action.autoApprove) {
        await executeReply(scheduledReply);
      }

      return {
        matched: true,
        action: rule.actions,
        scheduledReply,
      };
    }
  }

  return { matched: false };
}

/**
 * Execute a scheduled reply
 */
export async function executeReply(scheduledReply: ScheduledReply): Promise<boolean> {
  console.log(`[Auto Reply] Executing reply ${scheduledReply.id}`);

  try {
    // Here you would call the actual platform API to post the reply
    // For now, simulate success
    
    // Update status
    scheduledReply.status = 'sent';
    scheduledReplies.set(scheduledReply.id, scheduledReply);

    console.log(`[Auto Reply] Reply sent successfully`);
    return true;

  } catch (error) {
    console.error(`[Auto Reply] Failed to send reply:`, error);
    scheduledReply.status = 'failed';
    scheduledReplies.set(scheduledReply.id, scheduledReply);
    return false;
  }
}

/**
 * Schedule a reply for later
 */
export function scheduleReply(
  reviewId: string,
  platform: string,
  replyText: string,
  delayMinutes: number,
  autoPost: boolean
): ScheduledReply {
  const scheduled: ScheduledReply = {
    id: `sch_${Date.now()}`,
    reviewId,
    platform,
    replyText,
    scheduledFor: new Date(Date.now() + delayMinutes * 60000),
    status: 'pending',
    autoPost,
    createdAt: new Date(),
  };

  scheduledReplies.set(scheduled.id, scheduled);
  console.log(`[Auto Reply] Scheduled reply for ${delayMinutes} minutes later`);

  return scheduled;
}

/**
 * Cancel a scheduled reply
 */
export function cancelScheduledReply(scheduledId: string): boolean {
  const reply = scheduledReplies.get(scheduledId);
  if (reply && reply.status === 'pending') {
    reply.status = 'cancelled';
    scheduledReplies.set(scheduledId, reply);
    return true;
  }
  return false;
}

/**
 * Get all scheduled replies
 */
export function getScheduledReplies(status?: string): ScheduledReply[] {
  const replies = Array.from(scheduledReplies.values());
  if (status) {
    return replies.filter(r => r.status === status);
  }
  return replies;
}

/**
 * Get auto-reply rules
 */
export function getAutoReplyRules(): AutoReplyRule[] {
  return Array.from(autoReplyRules.values());
}

/**
 * Update auto-reply rule
 */
export function updateAutoReplyRule(ruleId: string, updates: Partial<AutoReplyRule>): AutoReplyRule | null {
  const rule = autoReplyRules.get(ruleId);
  if (!rule) return null;

  const updated = { ...rule, ...updates };
  autoReplyRules.set(ruleId, updated);
  return updated;
}

/**
 * Run scheduler (call this periodically, e.g., every minute)
 */
export async function runScheduler(): Promise<void> {
  const now = new Date();
  const pendingReplies = Array.from(scheduledReplies.values())
    .filter(r => r.status === 'pending' && r.scheduledFor <= now);

  console.log(`[Scheduler] Processing ${pendingReplies.length} pending replies`);

  for (const reply of pendingReplies) {
    await executeReply(reply);
  }
}

// Initialize default rules
createDefaultRules();

export const autoReplyScheduler = {
  createDefaultRules,
  processReviewWithRules,
  scheduleReply,
  cancelScheduledReply,
  getScheduledReplies,
  getAutoReplyRules,
  updateAutoReplyRule,
  runScheduler,
};
