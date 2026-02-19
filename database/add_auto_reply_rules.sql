-- Add auto_reply_rules table
CREATE TABLE auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_auto_reply_rules_user_id ON auto_reply_rules(user_id);
CREATE INDEX idx_auto_reply_rules_active ON auto_reply_rules(is_active);

-- Add RLS policy
ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-reply rules" ON auto_reply_rules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own auto-reply rules" ON auto_reply_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own auto-reply rules" ON auto_reply_rules FOR UPDATE
  USING (user_id = auth.uid());