-- =============================================
-- AUTOREVIEW AI - DATABASE FIX FOR YOUR SCHEMA
-- Paste this in Supabase SQL Editor and click Run
-- =============================================

-- Step 1: Add missing columns to your reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS source_platform TEXT;

-- Step 2: Update existing rows to have a default status
UPDATE reviews SET status = 'pending' WHERE status IS NULL;

-- Step 3: Create index for status column (for faster queries)
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Step 4: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own replies" ON replies;
DROP POLICY IF EXISTS "Users can insert own replies" ON replies;

-- Step 5: Recreate policies with correct permissions
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own replies"
  ON replies FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own replies"
  ON replies FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Step 6: Verify the fix
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;
