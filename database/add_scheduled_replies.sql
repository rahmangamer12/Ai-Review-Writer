-- Add scheduled_replies table for auto-reply system
CREATE TABLE scheduled_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  platform TEXT,
  reply_text TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
  auto_post BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_scheduled_replies_user_id ON scheduled_replies(user_id);
CREATE INDEX idx_scheduled_replies_review_id ON scheduled_replies(review_id);
CREATE INDEX idx_scheduled_replies_status ON scheduled_replies(status);
CREATE INDEX idx_scheduled_replies_scheduled_for ON scheduled_replies(scheduled_for);

-- Add RLS policy
ALTER TABLE scheduled_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled replies" ON scheduled_replies FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own scheduled replies" ON scheduled_replies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scheduled replies" ON scheduled_replies FOR UPDATE
  USING (user_id = auth.uid());