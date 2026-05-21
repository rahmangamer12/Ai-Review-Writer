CREATE TABLE IF NOT EXISTS "Feedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "rating" INTEGER NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "message" TEXT NOT NULL,
  "email" TEXT,
  "pageUrl" TEXT,
  "userAgent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Feedback_userId_idx" ON "Feedback"("userId");
CREATE INDEX IF NOT EXISTS "Feedback_status_idx" ON "Feedback"("status");
CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt");

