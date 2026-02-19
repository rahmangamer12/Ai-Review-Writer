-- AutoReview AI Database Schema
-- PostgreSQL with Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  author_name TEXT NOT NULL,
  author_email TEXT,
  source_platform TEXT, -- 'google', 'facebook', 'twitter', 'manual', etc.
  sentiment_score DECIMAL(3, 2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  emotion_label TEXT CHECK (emotion_label IN ('happy', 'angry', 'disappointed', 'excited', 'frustrated', 'calm')),
  original_language TEXT CHECK (original_language IN ('english', 'urdu', 'roman_urdu')),
  topics JSONB DEFAULT '[]',
  has_abusive_content BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Replies table
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tone_used TEXT CHECK (tone_used IN ('professional', 'friendly', 'desi_casual')),
  language TEXT CHECK (language IN ('english', 'urdu', 'roman_urdu')),
  status TEXT CHECK (status IN ('draft', 'published', 'rejected')) DEFAULT 'draft',
  is_edited_by_human BOOLEAN DEFAULT FALSE,
  original_ai_content TEXT, -- Store AI-generated content before human edits
  human_edited_content TEXT, -- Store human-edited version
  auto_approved BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table for dashboard
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_reviews INTEGER DEFAULT 0,
  sentiment_distribution JSONB DEFAULT '{}',
  average_rating DECIMAL(3, 2),
  topics JSONB DEFAULT '{}',
  auto_reply_rate DECIMAL(3, 2),
  human_intervention_rate DECIMAL(3, 2),
  time_saved_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Learning data table for AI improvement
CREATE TABLE ai_learning_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  original_sentiment JSONB,
  corrected_sentiment JSONB,
  original_ai_reply TEXT,
  human_correction TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('edit', 'approve', 'reject')),
  learning_applied BOOLEAN DEFAULT FALSE,
  patterns_identified JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment_label);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_replies_review_id ON replies(review_id);
CREATE INDEX idx_replies_status ON replies(status);
CREATE INDEX idx_analytics_user_date ON analytics(user_id, date);
CREATE INDEX idx_learning_data_review_id ON ai_learning_data(review_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Reviews access policies
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (user_id = auth.uid());

-- Replies access policies
CREATE POLICY "Users can view own replies" ON replies FOR SELECT 
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = replies.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "Users can insert own replies" ON replies FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = replies.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "Users can update own replies" ON replies FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = replies.review_id AND reviews.user_id = auth.uid()));

-- Analytics access policies
CREATE POLICY "Users can view own analytics" ON analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own analytics" ON analytics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own analytics" ON analytics FOR UPDATE USING (user_id = auth.uid());

-- Learning data access policies
CREATE POLICY "Users can view own learning data" ON ai_learning_data FOR SELECT 
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = ai_learning_data.review_id AND reviews.user_id = auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_replies_updated_at BEFORE UPDATE ON replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate sentiment score distribution
CREATE OR REPLACE FUNCTION calculate_sentiment_distribution(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'positive', COUNT(*) FILTER (WHERE sentiment_label = 'positive'),
    'negative', COUNT(*) FILTER (WHERE sentiment_label = 'negative'),
    'neutral', COUNT(*) FILTER (WHERE sentiment_label = 'neutral')
  ) INTO result
  FROM reviews
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

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
CREATE INDEX idx_scheduled_replies_user_id ON scheduled_replies(user_id);
CREATE INDEX idx_scheduled_replies_review_id ON scheduled_replies(review_id);
CREATE INDEX idx_scheduled_replies_status ON scheduled_replies(status);
CREATE INDEX idx_scheduled_replies_scheduled_for ON scheduled_replies(scheduled_for);

CREATE INDEX idx_auto_reply_rules_user_id ON auto_reply_rules(user_id);
CREATE INDEX idx_auto_reply_rules_active ON auto_reply_rules(is_active);

-- Add RLS policy for new tables
ALTER TABLE scheduled_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled replies" ON scheduled_replies FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own scheduled replies" ON scheduled_replies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scheduled replies" ON scheduled_replies FOR UPDATE
  USING (user_id = auth.uid());

ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-reply rules" ON auto_reply_rules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own auto-reply rules" ON auto_reply_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own auto-reply rules" ON auto_reply_rules FOR UPDATE
  USING (user_id = auth.uid());

-- Function to update analytics daily
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  sentiment_dist JSONB;
  avg_rating DECIMAL;
  total_reviews_count INTEGER;
  auto_reply_percentage DECIMAL;
  human_intervention_percentage DECIMAL;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM reviews WHERE created_at >= CURRENT_DATE LOOP
    -- Calculate metrics
    SELECT jsonb_build_object(
      'positive', COUNT(*) FILTER (WHERE sentiment_label = 'positive'),
      'negative', COUNT(*) FILTER (WHERE sentiment_label = 'negative'),
      'neutral', COUNT(*) FILTER (WHERE sentiment_label = 'neutral')
    ) INTO sentiment_dist
    FROM reviews
    WHERE user_id = user_record.user_id
      AND created_at >= CURRENT_DATE;

    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM reviews
    WHERE user_id = user_record.user_id
      AND created_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO total_reviews_count
    FROM reviews
    WHERE user_id = user_record.user_id
      AND created_at >= CURRENT_DATE;

    -- Calculate auto-reply rate
    SELECT CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE auto_approved = true)::DECIMAL / COUNT(*)) * 100
    END INTO auto_reply_percentage
    FROM replies r
    JOIN reviews rev ON r.review_id = rev.id
    WHERE rev.user_id = user_record.user_id
      AND rev.created_at >= CURRENT_DATE;

    -- Calculate human intervention rate
    SELECT CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE is_edited_by_human = true)::DECIMAL / COUNT(*)) * 100
    END INTO human_intervention_percentage
    FROM replies r
    JOIN reviews rev ON r.review_id = rev.id
    WHERE rev.user_id = user_record.user_id
      AND rev.created_at >= CURRENT_DATE;

    -- Upsert analytics record
    INSERT INTO analytics (
      user_id, date, total_reviews, sentiment_distribution,
      average_rating, auto_reply_rate, human_intervention_rate
    ) VALUES (
      user_record.user_id, CURRENT_DATE, total_reviews_count, sentiment_dist,
      avg_rating, auto_reply_percentage, human_intervention_percentage
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      total_reviews = EXCLUDED.total_reviews,
      sentiment_distribution = EXCLUDED.sentiment_distribution,
      average_rating = EXCLUDED.average_rating,
      auto_reply_rate = EXCLUDED.auto_reply_rate,
      human_intervention_rate = EXCLUDED.human_intervention_rate,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;