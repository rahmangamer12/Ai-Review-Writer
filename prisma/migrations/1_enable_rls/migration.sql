-- Defense-in-depth: enable Row Level Security on all app tables.
-- The app connects as the `postgres` owner role (rolbypassrls=true), so Prisma
-- queries are UNAFFECTED. With RLS enabled and no permissive policies, the
-- Supabase `anon`/`authenticated` (PostgREST) roles are denied all access —
-- closing any accidental anon-key data exposure. Ownership is still enforced
-- in application code for every Prisma query.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectedPlatform" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookEvent" ENABLE ROW LEVEL SECURITY;
