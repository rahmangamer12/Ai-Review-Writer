-- =============================================
-- TEMPORARY RLS FIX (Development Only)
-- This disables RLS completely - NOT for production!
-- =============================================

-- Option 2: Disable RLS completely (ONLY FOR DEVELOPMENT)
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE replies DISABLE ROW LEVEL SECURITY;

-- Or Option 3: Force row security off for the table owner
ALTER TABLE reviews FORCE ROW LEVEL SECURITY OFF;
ALTER TABLE replies FORCE ROW LEVEL SECURITY OFF;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('reviews', 'replies');
