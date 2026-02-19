/**
 * AUTO-REPLY SCHEDULER
 * Handles scheduled and automatic replies to reviews
 * This file now exports the database-backed scheduler
 */

// Import the database-backed scheduler
import {
  autoReplyScheduler as dbAutoReplyScheduler,
  createDefaultRules,
  processReviewWithRules,
  scheduleReply,
  cancelScheduledReply,
  getScheduledReplies,
  getAutoReplyRules,
  updateAutoReplyRule,
  runScheduler,
  initializeUserAutoReply,
  ScheduledReply,
  AutoReplyRule
} from './db-backed-scheduler';

// Export the interfaces
export type { ScheduledReply, AutoReplyRule };

// Export the main scheduler object
export {
  createDefaultRules,
  processReviewWithRules,
  scheduleReply,
  cancelScheduledReply,
  getScheduledReplies,
  getAutoReplyRules,
  updateAutoReplyRule,
  runScheduler,
  initializeUserAutoReply,
  dbAutoReplyScheduler as autoReplyScheduler
};
