# 🚀 AutoReview AI - Production Setup Guide

## ⚙️ Environment Configuration

1. Copy `.env.example` to `.env`
2. Replace placeholder values with your actual credentials:

### Required Services Setup

#### 1. Clerk Authentication
- Visit [Clerk Dashboard](https://dashboard.clerk.com)
- Create an account and new application
- Get your Public Key and Secret Key
- Add to `.env`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

#### 2. Supabase Database
- Visit [Supabase](https://supabase.com)
- Create a new project
- Get your Project URL and Anon Key
- Add to `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### 3. LongCat AI
- Visit [LongCat AI](https://longcat.ai)
- Get your API key
- Add to `.env`:
```
LONGCAT_AI_API_KEY=your_longcat_api_key
```

#### 4. Payment Integration (Optional)
- Visit [Lemon Squeezy](https://lemonsqueezy.com)
- Create store and products
- Add to `.env`:
```
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_VARIANT_STARTER=your_variant_id
LEMONSQUEEZY_VARIANT_PROFESSIONAL=your_variant_id
LEMONSQUEEZY_VARIANT_ENTERPRISE=your_variant_id
```

## 🏗️ Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Node.js Server
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Docker
```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

## 🚀 Production Optimizations

### Performance
- Image optimization
- Bundle size optimization
- Caching strategies
- Database connection pooling

### Security
- HTTP security headers
- Input validation
- Rate limiting
- Authentication

### Error Handling
- Graceful degradation when services are unavailable
- Fallback UI for offline mode
- Comprehensive error logging

## 📊 Database Setup

If using Supabase, run these SQL commands to set up required tables:

```sql
-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  reviewer_name TEXT,
  author_name TEXT,
  rating INTEGER NOT NULL,
  review_text TEXT,
  content TEXT,
  platform TEXT NOT NULL,
  sentiment_label TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Replies table
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id),
  reply_text TEXT,
  content TEXT,
  ai_generated BOOLEAN DEFAULT false,
  is_edited_by_human BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected platforms table
CREATE TABLE connected_platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for data isolation
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reviews" ON reviews FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING (auth.uid()::text = user_id);
```

## 🧪 Testing Production Build

```bash
# Run production build locally
npm run build
npm start

# Or run with environment specific build
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**: Check Supabase URL and keys in `.env`
2. **Authentication Issues**: Verify Clerk keys are correct
3. **API Keys**: Make sure all required service keys are configured
4. **Build Errors**: Ensure all dependencies are properly installed

### Performance Monitoring

- Monitor database query performance
- Track API response times
- Monitor memory usage
- Check error logs regularly

## 📈 Scaling Considerations

- Database connection pooling
- CDN for static assets
- Caching strategies
- Load balancing
- Monitoring and alerting