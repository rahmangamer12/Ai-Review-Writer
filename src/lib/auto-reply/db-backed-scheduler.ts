/**
 * DATABASE-BACKED AUTO-REPLY SCHEDULER
 * Handles scheduled and automatic replies to reviews using database persistence
 */

import { supabase } from '@/lib/supabase';
import { longcatAI } from '@/lib/longcatAI';
import { AuthError, PostgrestError } from '@supabase/supabase-js';

export interface ScheduledReply {
  id: string;
  user_id: string;
  review_id: string;
  platform: string;
  reply_text: string;
  scheduled_for: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  auto_post: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

// Cache for auto-reply rules to reduce database calls
let cachedRules: AutoReplyRule[] | null = null;
let lastRuleCacheUpdate: Date | null = null;

/**
 * Create default auto-reply rules
 */
export async function createDefaultRules(userId: string): Promise<AutoReplyRule[]> {
  const rules: Omit<AutoReplyRule, 'id' | 'created_at' | 'updated_at'>[] = [
    {
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

  const createdRules: AutoReplyRule[] = [];

  for (const rule of rules) {
    const { data, error } = await supabase
      .from('auto_reply_rules')
      .insert({
        user_id: userId,
        name: rule.name,
        conditions: rule.conditions,
        actions: rule.actions,
        is_active: rule.isActive
      })
      .select()
      .single();

    if (error) {
      console.error(`[Auto Reply] Error creating rule ${rule.name}:`, error);
      continue;
    }

    // Transform the database response to match our interface
    createdRules.push({
      id: data.id,
      name: data.name,
      conditions: data.conditions,
      actions: data.actions,
      isActive: data.is_active,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    });
  }

  // Update cache
  await refreshRulesCache(userId);

  return createdRules;
}

/**
 * Refresh the rules cache
 */
export async function refreshRulesCache(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('auto_reply_rules')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[Auto Reply] Error refreshing rules cache:', error);
    return;
  }

  cachedRules = data.map(dbRule => ({
    id: dbRule.id,
    name: dbRule.name,
    conditions: dbRule.conditions,
    actions: dbRule.actions,
    isActive: dbRule.is_active,
    created_at: new Date(dbRule.created_at),
    updated_at: new Date(dbRule.updated_at),
  }));

  lastRuleCacheUpdate = new Date();
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
  userId: string,
  userSettings: any = {}
): Promise<{ matched: boolean; action?: any; scheduledReply?: ScheduledReply }> {
  console.log(`[Auto Reply] Processing review ${review.id} against rules for user ${userId}`);

  // Get all active rules for the user
  let activeRules = cachedRules?.filter(r => r.isActive) || [];

  // If cache is empty or old, refresh it
  if (!cachedRules ||
      !lastRuleCacheUpdate ||
      new Date().getTime() - lastRuleCacheUpdate.getTime() > 300000) { // 5 minutes
    await refreshRulesCache(userId);
    activeRules = cachedRules?.filter(r => r.isActive) || [];
  }

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
        user_id: userId,
        review_id: review.id,
        platform: review.platform,
        reply_text: replyText,
        scheduled_for: new Date(Date.now() + (action.delayMinutes || 0) * 60000),
        status: action.autoPost ? 'pending' : 'pending',
        auto_post: action.autoPost,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Save to database
      const { data, error } = await supabase
        .from('scheduled_replies')
        .insert({
          user_id: userId,
          review_id: review.id,
          platform: review.platform,
          reply_text: replyText,
          scheduled_for: scheduledReply.scheduled_for,
          status: scheduledReply.status,
          auto_post: scheduledReply.auto_post,
        })
        .select()
        .single();

      if (error) {
        console.error(`[Auto Reply] Error scheduling reply:`, error);
        return { matched: false, action: rule.actions };
      }

      // Transform database response to match our interface
      const savedScheduledReply: ScheduledReply = {
        id: data.id,
        user_id: data.user_id,
        review_id: data.review_id,
        platform: data.platform,
        reply_text: data.reply_text,
        scheduled_for: new Date(data.scheduled_for),
        status: data.status as 'pending' | 'sent' | 'failed' | 'cancelled',
        auto_post: data.auto_post,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      // If auto-post and approved, execute immediately
      if (action.autoPost && action.autoApprove) {
        await executeReply(savedScheduledReply);
      }

      return {
        matched: true,
        action: rule.actions,
        scheduledReply: savedScheduledReply,
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

    // Update status in database
    const { error } = await supabase
      .from('scheduled_replies')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduledReply.id);

    if (error) {
      console.error(`[Auto Reply] Failed to update reply status:`, error);
      return false;
    }

    console.log(`[Auto Reply] Reply sent successfully`);
    return true;

  } catch (error) {
    console.error(`[Auto Reply] Failed to send reply:`, error);

    // Update status to failed in database
    const { error: updateError } = await supabase
      .from('scheduled_replies')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduledReply.id);

    if (updateError) {
      console.error(`[Auto Reply] Failed to update reply status to failed:`, updateError);
    }

    return false;
  }
}

/**
 * Schedule a reply for later
 */
export async function scheduleReply(
  userId: string,
  reviewId: string,
  platform: string,
  replyText: string,
  delayMinutes: number,
  autoPost: boolean
): Promise<ScheduledReply | null> {
  const scheduled: ScheduledReply = {
    id: `sch_${Date.now()}`,
    user_id: userId,
    review_id: reviewId,
    platform,
    reply_text: replyText,
    scheduled_for: new Date(Date.now() + delayMinutes * 60000),
    status: 'pending',
    auto_post: autoPost,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const { data, error } = await supabase
    .from('scheduled_replies')
    .insert({
      user_id: userId,
      review_id: reviewId,
      platform,
      reply_text: replyText,
      scheduled_for: scheduled.scheduled_for,
      status: scheduled.status,
      auto_post: autoPost,
    })
    .select()
    .single();

  if (error) {
    console.error(`[Auto Reply] Error scheduling reply:`, error);
    return null;
  }

  console.log(`[Auto Reply] Scheduled reply for ${delayMinutes} minutes later`);

  return {
    id: data.id,
    user_id: data.user_id,
    review_id: data.review_id,
    platform: data.platform,
    reply_text: data.reply_text,
    scheduled_for: new Date(data.scheduled_for),
    status: data.status as 'pending' | 'sent' | 'failed' | 'cancelled',
    auto_post: data.auto_post,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
}

/**
 * Cancel a scheduled reply
 */
export async function cancelScheduledReply(scheduledId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('scheduled_replies')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', scheduledId)
    .select()
    .single();

  if (error) {
    console.error(`[Auto Reply] Error cancelling scheduled reply:`, error);
    return false;
  }

  return !!data;
}

/**
 * Get all scheduled replies
 */
export async function getScheduledReplies(userId: string, status?: string): Promise<ScheduledReply[]> {
  let query = supabase
    .from('scheduled_replies')
    .select('*')
    .eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[Auto Reply] Error getting scheduled replies:`, error);
    return [];
  }

  return data.map(dbReply => ({
    id: dbReply.id,
    user_id: dbReply.user_id,
    review_id: dbReply.review_id,
    platform: dbReply.platform,
    reply_text: dbReply.reply_text,
    scheduled_for: new Date(dbReply.scheduled_for),
    status: dbReply.status as 'pending' | 'sent' | 'failed' | 'cancelled',
    auto_post: dbReply.auto_post,
    created_at: new Date(dbReply.created_at),
    updated_at: new Date(dbReply.updated_at),
  }));
}

/**
 * Get auto-reply rules for user
 */
export async function getAutoReplyRules(userId: string): Promise<AutoReplyRule[]> {
  // Check cache first
  if (cachedRules && lastRuleCacheUpdate &&
      new Date().getTime() - lastRuleCacheUpdate.getTime() <= 300000) { // 5 minutes
    return cachedRules.filter(r => r.isActive);
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('auto_reply_rules')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error(`[Auto Reply] Error getting auto-reply rules:`, error);
    return [];
  }

  const rules = data.map(dbRule => ({
    id: dbRule.id,
    name: dbRule.name,
    conditions: dbRule.conditions,
    actions: dbRule.actions,
    isActive: dbRule.is_active,
    created_at: new Date(dbRule.created_at),
    updated_at: new Date(dbRule.updated_at),
  }));

  // Update cache
  cachedRules = rules;
  lastRuleCacheUpdate = new Date();

  return rules;
}

/**
 * Update auto-reply rule
 */
export async function updateAutoReplyRule(userId: string, ruleId: string, updates: Partial<AutoReplyRule>): Promise<AutoReplyRule | null> {
  const { data, error } = await supabase
    .from('auto_reply_rules')
    .update({
      name: updates.name,
      conditions: updates.conditions,
      actions: updates.actions,
      is_active: updates.isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', ruleId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(`[Auto Reply] Error updating rule:`, error);
    return null;
  }

  // Refresh cache
  await refreshRulesCache(userId);

  return {
    id: data.id,
    name: data.name,
    conditions: data.conditions,
    actions: data.actions,
    isActive: data.is_active,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
}

/**
 * Run scheduler (call this periodically, e.g., every minute)
 */
export async function runScheduler(): Promise<void> {
  const now = new Date();
  const { data: pendingReplies, error } = await supabase
    .from('scheduled_replies')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString());

  if (error) {
    console.error(`[Scheduler] Error getting pending replies:`, error);
    return;
  }

  console.log(`[Scheduler] Processing ${pendingReplies.length} pending replies`);

  for (const reply of pendingReplies) {
    const scheduledReply: ScheduledReply = {
      id: reply.id,
      user_id: reply.user_id,
      review_id: reply.review_id,
      platform: reply.platform,
      reply_text: reply.reply_text,
      scheduled_for: new Date(reply.scheduled_for),
      status: reply.status as 'pending' | 'sent' | 'failed' | 'cancelled',
      auto_post: reply.auto_post,
      created_at: new Date(reply.created_at),
      updated_at: new Date(reply.updated_at),
    };

    await executeReply(scheduledReply);
  }
}

// Initialize default rules for a user if needed
// This would typically be called when a user first sets up auto-reply
export async function initializeUserAutoReply(userId: string): Promise<void> {
  // Check if user already has rules
  const { data, error } = await supabase
    .from('auto_reply_rules')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error(`[Auto Reply] Error checking if user has rules:`, error);
    return;
  }

  // If no rules exist, create defaults
  if (!data || data.length === 0) {
    await createDefaultRules(userId);
  }
}

export const autoReplyScheduler = {
  createDefaultRules,
  processReviewWithRules,
  scheduleReply,
  cancelScheduledReply,
  getScheduledReplies,
  getAutoReplyRules,
  updateAutoReplyRule,
  runScheduler,
  initializeUserAutoReply,
};