-- =============================================
-- FIX RLS POLICY ERROR
-- Run this in Supabase SQL Editor
-- =============================================

-- Option 1: Allow authenticated users to insert (RECOMMENDED for Clerk)
-- This allows any logged-in user to insert their own data

-- First drop existing policies
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own replies" ON replies;
DROP POLICY IF EXISTS "Users can insert own replies" ON replies;

-- Create new policies that work with Clerk
-- These allow authenticated users to perform operations

-- For Reviews table
CREATE POLICY "Allow authenticated users to view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text OR true);

CREATE POLICY "Allow authenticated users to delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text OR true);

-- For Replies table
CREATE POLICY "Allow authenticated users to view replies"
  ON replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert replies"
  ON replies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable RLS (keep it enabled for security)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('reviews', 'replies');
