-- =============================================
-- AUTOREVIEW AI - FIX REVIEWS TABLE
-- Run this in your Supabase SQL Editor
-- =============================================

-- First, let's see what columns exist
DO $$
BEGIN
    -- Check if 'review_text' column exists (old schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'review_text'
    ) THEN
        -- Rename old columns to new schema
        ALTER TABLE reviews RENAME COLUMN review_text TO content;
        ALTER TABLE reviews RENAME COLUMN reviewer_name TO author_name;
        ALTER TABLE reviews RENAME COLUMN reviewer_email TO author_email;
        
        RAISE NOTICE 'Renamed old columns to new schema';
    ELSE
        RAISE NOTICE 'Old columns not found, checking new columns...';
    END IF;
    
    -- Add columns if they don't exist (new schema)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'content'
    ) THEN
        ALTER TABLE reviews ADD COLUMN content TEXT;
        RAISE NOTICE 'Added content column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'author_name'
    ) THEN
        ALTER TABLE reviews ADD COLUMN author_name TEXT;
        RAISE NOTICE 'Added author_name column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'author_email'
    ) THEN
        ALTER TABLE reviews ADD COLUMN author_email TEXT;
        RAISE NOTICE 'Added author_email column';
    END IF;
END $$;

-- Fix status column enum
DO $$
BEGIN
    -- Check if status column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'status'
    ) THEN
        -- Update any old status values
        UPDATE reviews SET status = 'approved' WHERE status = 'processed';
        UPDATE reviews SET status = 'approved' WHERE status = 'published';
        
        -- Drop the check constraint if it exists
        ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
        
        -- Add the correct check constraint
        ALTER TABLE reviews ADD CONSTRAINT reviews_status_check 
            CHECK (status IN ('pending', 'approved', 'rejected'));
            
        RAISE NOTICE 'Fixed status column constraints';
    ELSE
        -- Add status column if it doesn't exist
        ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'pending' 
            CHECK (status IN ('pending', 'approved', 'rejected'));
        RAISE NOTICE 'Added status column';
    END IF;
END $$;

-- Ensure user_id column exists and is correct type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE reviews ADD COLUMN user_id TEXT NOT NULL DEFAULT 'temp';
        RAISE NOTICE 'Added user_id column';
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Recreate policies
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

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;
