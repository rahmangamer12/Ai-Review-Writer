/**
 * Prisma-safe auto-reply scheduler facade.
 *
 * The old Supabase-backed scheduler is intentionally not imported at runtime.
 * Auto-posting still needs a dedicated Prisma data model and platform posting
 * contracts before it can be enabled safely in production.
 */

export interface ScheduledReply {
  id: string
  user_id: string
  review_id: string
  platform: string
  reply_text: string
  scheduled_for: Date
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  auto_post: boolean
  created_at: Date
  updated_at: Date
}

export interface AutoReplyRule {
  id: string
  user_id: string
  name: string
  enabled: boolean
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

const productionDisabledMessage =
  'Auto-reply scheduling is disabled until the Prisma scheduler model is enabled.'

export async function createDefaultRules(..._args: unknown[]): Promise<AutoReplyRule[]> {
  return []
}

export async function processReviewWithRules(..._args: unknown[]) {
  return {
    processed: false,
    reason: productionDisabledMessage,
  }
}

export async function scheduleReply(..._args: unknown[]): Promise<ScheduledReply | null> {
  return null
}

export async function cancelScheduledReply(..._args: unknown[]): Promise<boolean> {
  return false
}

export async function getScheduledReplies(..._args: unknown[]): Promise<ScheduledReply[]> {
  return []
}

export async function getAutoReplyRules(..._args: unknown[]): Promise<AutoReplyRule[]> {
  return []
}

export async function updateAutoReplyRule(..._args: unknown[]): Promise<AutoReplyRule | null> {
  return null
}

export async function runScheduler() {
  return {
    success: true,
    processed: 0,
    message: productionDisabledMessage,
  }
}

export async function initializeUserAutoReply(..._args: unknown[]): Promise<void> {
  // No-op until a Prisma-backed rule/schedule model is added.
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
}
