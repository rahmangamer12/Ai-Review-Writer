# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoReview AI is a comprehensive SaaS platform for managing and responding to customer reviews using AI. It supports multiple platforms (Google, Facebook, Yelp, TripAdvisor) with features like AI-powered reply generation, sentiment analysis, auto-reply system, and Chrome extension integration.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI**: LongCat AI API
- **Deployment**: Vercel
- **3D Graphics**: React Three Fiber, Three.js
- **State Management**: Zustand

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── agentic/        # Agentic review processing
│   │   ├── analytics/      # Analytics data
│   │   ├── auto-reply/     # Auto-reply system APIs
│   │   ├── notifications/  # Notifications system
│   │   ├── platforms/      # Platform integrations
│   │   └── reviews/        # Review management APIs
│   ├── dashboard/          # Dashboard page
│   ├── reviews/            # Reviews management
│   └── ...                 # Other pages
├── components/             # React components
│   ├── ui/                 # UI components (StatCard, ReviewItem, etc.)
│   ├── 3d/                 # 3D visualizations (AIBrainVisualization, etc.)
│   └── ...                 # Other shared components
├── lib/                    # Utility libraries
│   ├── integrations/       # Platform integrations (Google, Facebook, Yelp, etc.)
│   ├── auto-reply/         # Auto-reply system logic
│   ├── longcatAI.ts        # AI integration with LongCat API
│   ├── supabase.ts         # Database functions
│   └── ...                 # Other utilities
├── agents/                 # AI agents (autoReviewAgent.ts)
├── types/                  # Type definitions
└── hooks/                  # React hooks
```

## Key Features & Architecture

### 1. AI-Powered Review Analysis
- Sentiment analysis using LongCat AI API
- Multilingual support (English, Urdu, Roman Urdu, Hindi, Arabic, Spanish, French)
- Multiple AI model types: LongCat-Flash-Chat and LongCat-Flash-Thinking
- Tone selection (professional, friendly, apologetic, enthusiastic, desi styles)

### 2. Auto-Reply System
- Rule-based auto-reply scheduling
- Configurable delay times and approval workflows
- Rating and sentiment-based response triggers
- Integration with platform APIs for direct posting

### 3. Platform Integrations
- Google My Business, Facebook, Yelp, TripAdvisor
- OAuth authentication for each platform
- Webhook support for real-time updates
- Browser automation capabilities

### 4. 3D Analytics Dashboard
- Modern UI with 3D visualizations (React Three Fiber)
- Real-time statistics cards
- Review activity charts
- Sentiment and platform distribution visualizations
- Animated background effects

### 5. Chrome Extension
- Direct reply generation on review platforms
- AI-powered suggestions
- Multi-language support
- One-click copy to clipboard

## Core API Endpoints

### Reviews
- `GET /api/reviews/list` - List reviews with filters
- `POST /api/reviews/analyze` - Create/update reviews
- `POST /api/reviews/generate-reply` - Generate AI reply
- `POST /api/reviews/generate-test` - Generate test reviews
- `POST /api/reviews/bulk-analyze` - Bulk review processing

### Analytics
- `GET /api/analytics?days={days}` - Get analytics data

### Agentic Processing
- `POST /api/agentic/reviews` - Run agentic review processing
- `GET /api/agentic/reviews` - Get processing status

### Auto-Reply System
- `POST /api/auto-reply` - Schedule auto-replies
- `GET /api/auto-reply` - Get scheduled replies and rules
- `PUT /api/auto-reply` - Update auto-reply rules

### Platform Integrations
- `/api/platforms/google/connect` - Google OAuth
- `/api/platforms/facebook/connect` - Facebook OAuth
- `/api/platforms/yelp/connect` - Yelp API
- `/api/platforms/trustpilot/connect` - Trustpilot API

## Database Schema

Key tables include:
- `reviews` - Customer reviews with sentiment and status
- `replies` - AI-generated replies
- `user_settings` - User preferences for AI and auto-reply
- `connected_platforms` - Connected review platforms
- `analytics` - Daily analytics data

Supabase Row Level Security (RLS) is implemented to ensure users only access their own data.

## Development Commands

### Running the Application
```bash
# Install dependencies
npm install

# Run development server with increased memory
npm run dev

# Alternative development server without turbo
npm run dev:webpack

# Build for production
npm run build

# Run production build
npm start

# Clean build cache
npm run clean
```

### Docker Commands
```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Run with Docker Compose
npm run docker:compose
```

### Code Quality
```bash
# Lint code
npm run lint
```

## Environment Variables

Required environment variables in `.env.local`:
```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# AI Provider
LONGCAT_AI_API_KEY=...

# Optional: Platform APIs
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
YELP_API_KEY=...
```

## Key Implementation Notes

1. **AI Integration**: The LongCatAI class provides multiple methods for sentiment analysis, response generation, and deep review analysis using both chat and thinking models.

2. **Auto-Reply System**: The scheduler in `lib/auto-reply/scheduler.ts` handles rule-based auto-replies with support for different rating thresholds and sentiment-based responses.

3. **Security**: All API routes use Clerk authentication and Supabase RLS for data isolation.

4. **3D Components**: The application features advanced 3D visualizations using React Three Fiber and Three.js for AI brain visualization and animated backgrounds.

5. **Agentic Processing**: The `autoReviewAgent.ts` file contains the logic for comprehensive review analysis including language detection, abusive content detection, and topic extraction.

## Common Development Tasks

### Adding New Platform Integration
1. Add integration to `lib/integrations/`
2. Create API routes in `app/api/platforms/[platform]/`
3. Update database schema if needed
4. Add UI components for platform connection

### Extending AI Capabilities
1. Modify `lib/longcatAI.ts` for new AI features
2. Update agent logic in `agents/autoReviewAgent.ts`
3. Add new API routes in `app/api/` as needed
4. Update UI components to use new features

### Updating Dashboard Visualizations
1. Modify UI components in `components/ui/`
2. Update `app/dashboard/page.tsx` for layout
3. Enhance analytics API in `app/api/analytics/route.ts`