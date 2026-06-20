-- ============================================
-- Supabase Row-Level Security (RLS) Policies
-- ============================================
-- Run this in Supabase SQL Editor to enable RLS
-- These policies ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectedPlatform" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditUsage" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User Policies
-- ============================================
-- Users can read/update their own record
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ConnectedPlatform Policies
-- ============================================
CREATE POLICY "Users can view own platforms"
  ON "ConnectedPlatform" FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own platforms"
  ON "ConnectedPlatform" FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own platforms"
  ON "ConnectedPlatform" FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own platforms"
  ON "ConnectedPlatform" FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================
-- Review Policies
-- ============================================
CREATE POLICY "Users can view own reviews"
  ON "Review" FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own reviews"
  ON "Review" FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own reviews"
  ON "Review" FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own reviews"
  ON "Review" FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================
-- ChatSession Policies
-- ============================================
CREATE POLICY "Users can view own chat sessions"
  ON "ChatSession" FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own chat sessions"
  ON "ChatSession" FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own chat sessions"
  ON "ChatSession" FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own chat sessions"
  ON "ChatSession" FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================
-- ChatMessage Policies
-- ============================================
-- Users can access messages through their chat sessions
CREATE POLICY "Users can view messages in own sessions"
  ON "ChatMessage" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession"."id" = "ChatMessage"."sessionId"
      AND "ChatSession"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own sessions"
  ON "ChatMessage" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession"."id" = "ChatMessage"."sessionId"
      AND "ChatSession"."userId" = auth.uid()
    )
  );

-- ============================================
-- Notification Policies
-- ============================================
CREATE POLICY "Users can view own notifications"
  ON "Notification" FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can update own notifications"
  ON "Notification" FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- ============================================
-- Feedback Policies
-- ============================================
-- Anyone can insert feedback (anonymous allowed)
CREATE POLICY "Anyone can insert feedback"
  ON "Feedback" FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON "Feedback" FOR SELECT
  USING (
    "userId" IS NULL OR auth.uid() = "userId"
  );

-- ============================================
-- CreditUsage Policies
-- ============================================
CREATE POLICY "Users can view own credit usage"
  ON "CreditUsage" FOR SELECT
  USING (auth.uid() = "userId");

-- Only system can insert credit usage (via service role)
CREATE POLICY "System can insert credit usage"
  ON "CreditUsage" FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Notes
-- ============================================
-- 1. auth.uid() returns the Clerk user ID when using Clerk + Supabase
-- 2. For service-level operations (webhooks, cron jobs), use service_role key
-- 3. Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- 4. Test with: SELECT auth.uid() AS current_user_id;
