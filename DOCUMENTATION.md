# AutoReview AI - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Chrome Extension Guide](#chrome-extension-guide)
5. [Payment System](#payment-system)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Installation Guide](#installation-guide)
9. [Environment Variables](#environment-variables)
10. [Development Guide](#development-guide)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)
13. [Security Features](#security-features)
14. [Performance Optimization](#performance-optimization)
15. [API Documentation](#api-documentation)
16. [UI Components Guide](#ui-components-guide)

## Overview

AutoReview AI is a production-ready, powerful SaaS platform that helps businesses manage and respond to customer reviews using AI. The platform supports multiple review platforms including Google, Facebook, Yelp, and TripAdvisor with mobile-first responsive design and comprehensive analytics.

### Key Features:
- **Mobile-First Responsive Design** - Fully optimized for all screen sizes
- **AI-Powered Review Management** - Advanced sentiment analysis and response generation
- **Multi-Platform Integration** - Connect Google, Facebook, Yelp, TripAdvisor
- **Real-Time Analytics** - Comprehensive dashboard with actionable insights
- **Chrome Extension** - Generate replies directly on review platforms
- **Auto-Reply System** - Rules-based automated responses
- **Production-Ready Architecture** - Optimized for scalability and performance

## Features

### Core Features
- **AI-Powered Reply Generation** - Generate professional replies to reviews using AI
- **Multi-Platform Support** - Connect Google My Business, Facebook, Yelp, TripAdvisor
- **Sentiment Analysis** - Automatically analyze review sentiment
- **Auto-Reply System** - Set rules for automatic replies
- **Chrome Extension** - Generate replies directly on review platforms
- **Analytics Dashboard** - Track review metrics and performance

### AI Features
- **AI Review Generator** - Generate test reviews for demonstration
- **Agentic Reviews** - Auto-process reviews with AI
- **Multi-Language Support** - Support for English, Urdu, Roman Urdu, Hindi, Arabic, Spanish, French
- **Multiple Tones** - Friendly, professional, apologetic, enthusiastic, desi styles

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI**: LongCat AI API
- **Deployment**: Vercel
- **3D Graphics**: React Three Fiber, Three.js
- **State Management**: Zustand
- **Payment**: Lemon Squeezy
- **Chrome Extension**: Manifest V3

## Chrome Extension Guide

### Architecture
```
chrome-extension/
├── manifest.json           # Extension configuration
├── popup/                 # Popup UI
│   ├── popup.html         # Popup interface
│   └── popup.js           # Popup logic
├── content/               # Content scripts
│   ├── scraper.js         # Review detection and scraping
│   └── styles.css         # UI styles for content script
├── background/            # Background service worker
│   └── background.js      # Background tasks
├── icons/                 # Extension icons (16, 48, 128px)
└── README.md              # Extension documentation
```

### How It Works

#### 1. Content Script (`content/scraper.js`)
- Runs on supported platforms (Google Maps, Facebook, Yelp, etc.)
- Detects reviews on the page using platform-specific selectors
- Adds "✨ AI Reply" buttons to each detected review
- Handles real-time review detection (mutation observers)

#### 2. Platform Detection
- **Google Maps**: Detects via `[data-review-id]` selectors
- **Facebook**: Detects via `[role="article"]` selectors
- **Yelp**: Detects via `.review` class selectors
- **TripAdvisor**: Detects via `.review-container` selectors
- **Trustpilot**: Detects via `[data-review-id]` selectors

#### 3. Popup Interface (`popup/popup.html`)
- Shows detected platform
- Displays detected review preview
- Allows tone and language selection
- Generates AI replies
- Auto-copies to clipboard

#### 4. API Integration
- Connects to main application's `/api/reviews/generate-reply` endpoint
- Uses LongCat AI for response generation
- Handles error states gracefully

### Installation Process

#### For Development:
1. Navigate to `chrome://extensions/` in Chrome
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Extension is now active

#### For Production:
1. Package extension (zip contents)
2. Upload to Chrome Web Store Developer Dashboard
3. Follow Google's publishing guidelines

### Features

#### Platform Detection
- Automatically detects supported platforms
- Shows platform badge in popup
- Adjusts scraping logic per platform

#### Review Detection
- Scans page for review elements
- Extracts reviewer name, rating, and text
- Highlights detected reviews with AI buttons

#### AI Reply Generation
- Uses LongCat AI for response creation
- Supports multiple tones and languages
- Real-time generation with loading states

#### Clipboard Integration
- Auto-copies generated replies
- Shows success feedback
- Allows manual copy if auto-copy fails

#### Settings Management
- Saves preferences using Chrome storage
- Persistent settings across sessions
- Tone, language, and auto-copy preferences

### Content Script Functionality

#### Review Scraping
```javascript
// Example of how reviews are detected
function scrapeGoogleReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('[data-review-id]');

  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('.d4r55')?.textContent?.trim();
      const rating = extractRating(el);
      const text = el.querySelector('[class*="wiI7pd"]')?.textContent?.trim();

      if (text) {
        reviews.push({
          id: `google_${index}`,
          author,
          rating,
          text,
          platform: 'google',
          element: el,
        });
      }
    } catch (e) {
      console.error('Error scraping Google review:', e);
    }
  });
  return reviews;
}
```

#### AI Reply Button Injection
- Adds buttons to detected review elements
- Handles click events for reply generation
- Shows modal with generated reply
- Supports regenerating replies

#### Communication with Popup
- Uses Chrome extension messaging API
- Synchronizes review data between content script and popup
- Handles real-time updates

### Popup Functionality

#### Review Display
- Shows detected review preview
- Displays reviewer information
- Highlights rating with stars

#### Settings Panel
- Tone selection dropdown
- Language selection dropdown
- Auto-copy toggle switch
- Settings saved to Chrome storage

#### Reply Generation Flow
1. Extract review details
2. Send to backend API
3. Receive AI-generated reply
4. Display in popup
5. Auto-copy if enabled
6. Save to history

## Payment System

### Architecture
```
src/lib/lemonsqueezy.ts     # Lemon Squeezy client
src/app/api/checkout/       # Checkout API route
src/app/subscription/       # Subscription page
src/app/api/webhooks/       # Webhook handling
```

### Lemon Squeezy Integration

#### Configuration
- API key validation
- Store ID verification
- Plan variant IDs mapping
- Webhook secret management

#### Checkout Process
1. **Frontend**: User clicks subscription plan
2. **Backend**: `/api/checkout` validates plan and checks API configuration
3. **Lemon Squeezy**: Creates checkout session with details
4. **Redirect**: User sent to secure checkout page
5. **Webhook**: Payment confirmation updates user subscription
6. **Database**: Credits updated, subscription status changed

#### API Integration
```typescript
interface LemonSqueezyConfig {
  apiKey: string
  storeId: string
  variantIds: {
    starter: string
    professional: string
    enterprise: string
  }
}
```

#### Webhook Handling
- Subscription creation
- Payment success/failure
- Subscription cancellation
- Refund processing
- Credit updates

### Subscription Tiers

#### Free Plan ($0/month)
- 20 AI responses per month
- 1 platform connection
- Basic dashboard
- Email support
- No credit card required

#### Starter Plan ($9/month)
- 100 AI responses per month
- 3 platform connections
- Bulk reply generation
- Response templates
- Analytics dashboard
- All Free features included

#### Growth Plan ($19/month)
- 300 AI responses per month
- Unlimited platforms
- Auto-draft mode
- Sentiment reports
- Slack notifications
- Priority support
- All Starter features included

#### Business Plan ($39/month)
- 1000 AI responses per month
- Up to 5 team members
- Advanced analytics
- Custom integrations
- API access (coming soon)
- Priority support (4h response)
- All Growth features included

### Billing Cycles
- Monthly and yearly options (yearly saves 15%)
- Immediate activation on payment
- Pro-rated upgrades
- Downgrade protection
- Automatic renewal options

### Error Handling
- Graceful degradation when API keys missing
- Demo mode for development
- Fallback UI elements
- Comprehensive error logging

## API Endpoints

### Review Management API

#### `/api/reviews/list`
- **Method**: GET
- **Auth**: Required
- **Description**: List reviews with pagination and filters
- **Query Parameters**:
  - `page` - Page number
  - `limit` - Items per page
  - `platform` - Filter by platform
  - `sentiment` - Filter by sentiment
  - `status` - Filter by status
  - `search` - Search in review text

#### `/api/reviews/analyze`
- **Method**: POST
- **Auth**: Required
- **Description**: Create or update a review
- **Body**:
  - `content` - Review text
  - `rating` - Star rating (1-5)
  - `author_name` - Reviewer name
  - `author_email` - Reviewer email
  - `platform` - Review platform
  - `sentiment_label` - Sentiment classification

- **Method**: GET
- **Auth**: Required
- **Description**: Get review details
- **Query**: `id` - Review ID

- **Method**: PATCH
- **Auth**: Required
- **Description**: Update review status
- **Body**: `reviewId`, `status`

- **Method**: DELETE
- **Auth**: Required
- **Description**: Delete a review
- **Query**: `id` - Review ID

#### `/api/reviews/generate-reply`
- **Method**: POST
- **Auth**: Required
- **Description**: Generate AI reply for a review
- **Body**:
  - `reviewText` - Original review text
  - `rating` - Star rating
  - `authorName` - Reviewer name
  - `platform` - Review platform
  - `tone` - Reply tone
  - `language` - Reply language

#### `/api/reviews/generate-test`
- **Method**: POST
- **Auth**: Required
- **Description**: Generate test reviews for demonstration
- **Body**:
  - `count` - Number of reviews to generate
  - `platform` - Review platform
  - `ratingRange` - Rating distribution
  - `businessType` - Business type for review context

### Analytics API

#### `/api/analytics`
- **Method**: GET
- **Auth**: Required
- **Description**: Get comprehensive analytics data
- **Query Parameters**:
  - `days` - Number of days to analyze (default: 30)
  - `platform` - Filter by platform (optional)

### Agentic Processing API

#### `/api/agentic/reviews`
- **Method**: POST
- **Auth**: Required
- **Description**: Run agentic review processing
- **Body**: None required

- **Method**: GET
- **Auth**: Required
- **Description**: Get agentic processing status

### Platform Integration APIs

#### `/api/platforms/[platform]/connect`
- **Method**: GET
- **Auth**: Required
- **Description**: OAuth connection for platforms
- **Platforms**: google, facebook, yelp, trustpilot

### Checkout API

#### `/api/checkout`
- **Method**: POST
- **Auth**: Required
- **Description**: Create payment checkout session
- **Body**:
  - `plan` - Subscription plan
  - `billingCycle` - monthly/yearly
  - `userEmail` - User email
  - `userName` - User name
  - `userId` - User ID

### Webhook API

#### `/api/webhooks/lemonsqueezy`
- **Method**: POST
- **Auth**: Webhook signature verification
- **Description**: Handle Lemon Squeezy webhooks

## Database Schema

### Tables Overview
```
- users                  # User accounts and profiles
- reviews                # Customer reviews
- replies                # AI-generated responses
- subscriptions          # User subscriptions
- analytics              # Daily analytics data
- connected_platforms    # Platform connections
- notifications          # User notifications
- ai_learning_data       # AI training data
```

### Detailed Table Schemas

#### Users Table
```sql
users (
  id (UUID) PK,
  clerk_user_id (TEXT),
  email (TEXT),
  name (TEXT),
  avatar_url (TEXT),
  created_at (TIMESTAMP),
  updated_at (TIMESTAMP),
  credits (INTEGER) DEFAULT 50,
  plan (TEXT) DEFAULT 'free',
  is_active (BOOLEAN) DEFAULT TRUE
)
```

#### Reviews Table
```sql
reviews (
  id (UUID) PK,
  user_id (UUID) FK,
  review_text (TEXT),
  rating (INTEGER),
  reviewer_name (TEXT),
  reviewer_email (TEXT),
  platform (TEXT),
  sentiment_label (TEXT),
  status (TEXT) DEFAULT 'pending',
  created_at (TIMESTAMP),
  updated_at (TIMESTAMP),
  language (TEXT),
  reply_generated (BOOLEAN) DEFAULT FALSE
)
```

#### Replies Table
```sql
replies (
  id (UUID) PK,
  review_id (UUID) FK,
  reply_text (TEXT),
  ai_generated (BOOLEAN),
  is_edited_by_human (BOOLEAN),
  appropriateness_score (NUMERIC),
  status (TEXT) DEFAULT 'generated',
  created_at (TIMESTAMP),
  updated_at (TIMESTAMP)
)
```

#### Subscriptions Table
```sql
subscriptions (
  id (UUID) PK,
  user_id (UUID) FK,
  lemon_squeezy_id (TEXT),
  plan_name (TEXT),
  status (TEXT),
  renewal_date (TIMESTAMP),
  next_billing_date (TIMESTAMP),
  created_at (TIMESTAMP),
  updated_at (TIMESTAMP)
)
```

#### Connected Platforms Table
```sql
connected_platforms (
  id (UUID) PK,
  user_id (UUID) FK,
  platform_name (TEXT),
  connection_data (JSONB),
  is_active (BOOLEAN),
  created_at (TIMESTAMP),
  updated_at (TIMESTAMP)
)
```

#### Analytics Table
```sql
analytics (
  id (UUID) PK,
  user_id (UUID) FK,
  date (DATE),
  total_reviews (INTEGER),
  replied_reviews (INTEGER),
  pending_reviews (INTEGER),
  avg_rating (NUMERIC),
  response_rate (NUMERIC),
  created_at (TIMESTAMP)
)
```

### Row Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Authentication required for all operations
- Secure data isolation

## Installation Guide

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- Code editor (VS Code recommended)

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd autoreview-ai
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Set Up Environment Variables
Create a `.env` file in the root directory with the following content:

```env
# =============================================
# 🔐 AUTOREVIEW AI - ENVIRONMENT CONFIGURATION
# =============================================

# 🔑 CLERK AUTHENTICATION (Required)
# Get from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# 🗄️ SUPABASE DATABASE (Required)
# Get from: https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 💳 LEMON SQUEEZY PAYMENT (Required for production subscriptions)
# STEP 1: Go to https://app.lemonsqueezy.com/register
# STEP 2: Create a store
# STEP 3: Go to Settings > API
# STEP 4: Copy API Key and Store ID
# STEP 5: Create products (Starter $9, Growth $19, Business $39)
# STEP 6: Copy Variant IDs from each product
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_lemonsqueezy_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret
LEMONSQUEEZY_VARIANT_STARTER=your_starter_variant_id
LEMONSQUEEZY_VARIANT_PROFESSIONAL=your_growth_variant_id
LEMONSQUEEZY_VARIANT_ENTERPRISE=your_business_variant_id

# 🤖 AI PROVIDERS
LONGCAT_AI_API_KEY=your_longcat_ai_api_key
OPENAI_API_KEY=

# 🔧 APP SETTINGS
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=1
```

#### 4. Run Development Server
```bash
npm run dev
```

#### 5. Install Chrome Extension (Optional)
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from the project

### Database Setup

#### Supabase Setup
1. Create Supabase account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy project URL and anon key to environment variables
4. Set up RLS policies as defined in schema

#### Database Migrations
Run Supabase migrations to create tables:
```sql
-- Create tables using Supabase SQL editor or migrations
```

## Environment Variables

### Required Variables

#### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key from Clerk dashboard
- `CLERK_SECRET_KEY`: Secret key from Clerk dashboard

#### Database (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

#### AI Integration
- `LONGCAT_AI_API_KEY`: LongCat AI API key

### Optional Variables

#### Payment System (Lemon Squeezy)
- `LEMONSQUEEZY_API_KEY`: Lemon Squeezy API key
- `LEMONSQUEEZY_STORE_ID`: Lemon Squeezy store ID
- `LEMONSQUEEZY_WEBHOOK_SECRET`: Webhook secret
- `LEMONSQUEEZY_VARIANT_STARTER`: Starter plan variant ID
- `LEMONSQUEEZY_VARIANT_PROFESSIONAL`: Growth plan variant ID
- `LEMONSQUEEZY_VARIANT_ENTERPRISE`: Business plan variant ID

#### Application Settings
- `NEXT_PUBLIC_APP_URL`: Application URL
- `NEXTAUTH_SECRET`: NextAuth secret
- `NEXTAUTH_URL`: NextAuth URL
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry

### Development vs Production

#### Development
- Use `http://localhost:3000` for URLs
- Use test API keys when available
- Enable development features
- More verbose logging

#### Production
- Use actual domain URLs
- Use production API keys
- Enable security features
- Optimized performance settings

## Development Guide

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── agentic/        # Agentic review processing
│   │   ├── analytics/      # Analytics data
│   │   ├── notifications/  # Notifications system
│   │   ├── platforms/      # Platform integrations
│   │   └── reviews/        # Review management APIs
│   ├── dashboard/          # Dashboard page
│   ├── reviews/            # Reviews management
│   └── ...
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

### Development Workflow

#### 1. Code Standards
- Use TypeScript for type safety
- Follow consistent naming conventions
- Write comprehensive comments for complex logic
- Use proper error handling
- Implement proper loading states

#### 2. Component Structure
- Use React functional components
- Implement proper TypeScript interfaces
- Follow atomic design principles
- Ensure responsive design
- Use accessibility best practices

#### 3. API Development
- Follow REST principles
- Implement proper error responses
- Use authentication middleware
- Validate input data
- Handle edge cases

### Testing Guidelines

#### Unit Testing
- Test individual functions and utilities
- Mock external dependencies
- Cover edge cases
- Maintain high code coverage

#### Integration Testing
- Test API endpoints
- Verify database operations
- Check authentication flows
- Validate third-party integrations

#### UI Testing
- Test component interactions
- Verify responsive behavior
- Check accessibility
- Validate user flows

### Performance Optimization

#### Code Splitting
- Use dynamic imports for heavy components
- Lazy load non-critical features
- Optimize bundle sizes
- Implement proper caching

#### Database Optimization
- Use proper indexing
- Optimize queries
- Implement pagination
- Use efficient joins

#### API Optimization
- Cache API responses
- Use proper HTTP methods
- Implement rate limiting
- Optimize serialization

## Deployment Guide

### Vercel Deployment

#### 1. Connect to Vercel
1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Connect GitHub account
4. Import project

#### 2. Environment Variables
Set environment variables in Vercel dashboard:
- Go to Project Settings > Environment Variables
- Add all required variables from `.env` file
- Use production values

#### 3. Build Configuration
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`

#### 4. Domain Setup
- Configure custom domain
- Set up SSL certificate
- Configure DNS settings

### Production Checklist

#### Before Deployment
- [ ] Test all features in development
- [ ] Verify environment variables
- [ ] Check database migrations
- [ ] Test payment flow
- [ ] Verify Chrome extension
- [ ] Run security audit
- [ ] Optimize performance
- [ ] Test on mobile devices

#### Post-Deployment
- [ ] Monitor application logs
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Test production URLs
- [ ] Verify SSL certificates
- [ ] Check analytics tracking
- [ ] Monitor user feedback

### Scaling Considerations

#### Database Scaling
- Use Supabase scaling options
- Implement proper indexing
- Optimize queries for performance
- Consider read replicas

#### CDN and Caching
- Use Vercel's global CDN
- Implement proper caching strategies
- Cache API responses
- Optimize static assets

#### Load Balancing
- Use Vercel's auto-scaling
- Monitor resource usage
- Implement circuit breakers
- Set up health checks

## Troubleshooting

### Common Issues

#### Database Connection Issues
**Symptoms:**
- "Database connection failed" errors
- Empty mock data showing
- Analytics not loading

**Solutions:**
- Verify Supabase URL and key in environment variables
- Check network connectivity
- Ensure Supabase project is active
- Verify RLS policies are correctly configured

#### AI API Issues
**Symptoms:**
- "API key required" errors
- Slow response times
- Invalid responses

**Solutions:**
- Verify LongCat AI API key in environment variables
- Check API rate limits
- Verify network connectivity to AI provider
- Implement fallback responses

#### Chrome Extension Not Working
**Symptoms:**
- Extension not detecting reviews
- API errors in extension
- Buttons not appearing

**Solutions:**
- Ensure extension is loaded in developer mode
- Check API endpoint in `content/scraper.js`
- Verify backend is running and accessible
- Check browser console for errors

#### Payment System Issues
**Symptoms:**
- "Coming Soon" modal always showing
- Payment flow not working
- Subscription not updating

**Solutions:**
- Add Lemon Squeezy API keys to environment variables
- Verify webhook is properly configured
- Check Lemon Squeezy store and product setup
- Test with valid payment method

### Debugging Steps

#### Frontend Debugging
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Test authentication state
4. Check network requests and responses
5. Verify environment variables

#### Backend Debugging
1. Check server logs
2. Verify database connections
3. Test API endpoints individually
4. Check authentication middleware
5. Validate environment variables

#### Chrome Extension Debugging
1. Open Chrome DevTools on extension
2. Check extension console for errors
3. Verify manifest.json configuration
4. Test content script injection
5. Check popup functionality

### Performance Issues

#### Slow Page Loading
- Optimize database queries
- Implement proper caching
- Optimize images and assets
- Use code splitting
- Minimize JavaScript bundle size

#### Database Performance
- Add proper indexes
- Optimize queries
- Implement pagination
- Use efficient joins
- Consider database scaling

#### API Performance
- Cache API responses
- Optimize serialization
- Use efficient data structures
- Implement rate limiting
- Monitor API usage

## Security Features

### Authentication Security

#### Clerk Integration
- Multi-factor authentication support
- Secure session management
- Role-based permissions
- User impersonation protection
- Secure password policies

#### Session Management
- Automatic session expiration
- Secure cookie settings
- CSRF protection
- Session hijacking prevention
- Regular session validation

### Data Security

#### Database Security
- Row Level Security (RLS) implemented
- User data isolation
- Encrypted connections
- Access control policies
- Audit logging

#### API Security
- Authentication required for protected routes
- Input validation and sanitization
- Rate limiting implemented
- CORS policies configured
- Error message sanitization

### Payment Security

#### Lemon Squeezy Security
- Secure payment processing
- PCI compliance
- Webhook signature verification
- Payment data encryption
- Fraud detection

### Chrome Extension Security

#### Content Security Policy
- Restricted script execution
- Secure API calls
- Data isolation
- Origin validation
- Permission scope limitation

## Performance Optimization

### Frontend Optimization

#### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting
- Component lazy loading
- Library code splitting
- Vendor bundle optimization

#### Image Optimization
- Next.js Image component
- WebP format support
- Lazy loading
- Responsive images
- Image compression

#### Caching Strategies
- Browser caching
- Service worker caching
- CDN caching
- API response caching
- Component memoization

### Backend Optimization

#### Database Optimization
- Query optimization
- Proper indexing
- Connection pooling
- Database normalization
- Efficient data modeling

#### API Optimization
- Response caching
- Request batching
- Efficient serialization
- HTTP/2 support
- Compression techniques

### Monitoring and Analytics

#### Performance Monitoring
- Real User Monitoring (RUM)
- Server response times
- Database query performance
- API endpoint analytics
- Error tracking

## API Documentation

### Authentication API

#### Clerk Integration
- **User Registration**: Automatic with Clerk
- **User Login**: Clerk authentication flow
- **Session Management**: Clerk handles sessions
- **User Profile**: Clerk user management

### Review API Documentation

#### POST /api/reviews/analyze
**Description**: Create or update a review record with AI analysis

**Headers**:
- Authorization: Bearer {clerk_session_token}

**Request Body**:
```json
{
  "content": "string",
  "rating": "number (1-5)",
  "author_name": "string",
  "author_email": "string (optional)",
  "platform": "string (default: manual)",
  "sentiment_label": "string (optional)"
}
```

**Response**:
```json
{
  "id": "string",
  "review_text": "string",
  "rating": "number",
  "reviewer_name": "string",
  "platform": "string",
  "sentiment_label": "string",
  "status": "string",
  "created_at": "string (ISO date)"
}
```

#### POST /api/reviews/generate-reply
**Description**: Generate an AI-powered reply to a customer review

**Headers**:
- Authorization: Bearer {clerk_session_token}

**Request Body**:
```json
{
  "reviewText": "string",
  "rating": "number",
  "authorName": "string (optional)",
  "platform": "string (default: google)",
  "tone": "string (default: friendly)",
  "language": "string (default: en)"
}
```

**Response**:
```json
{
  "success": "boolean",
  "reply": "string",
  "metadata": {
    "original_rating": "number",
    "detected_sentiment": "string",
    "confidence": "number",
    "tone_used": "string",
    "platform": "string",
    "language": "string",
    "generated_at": "string (ISO date)",
    "ai_provider": "string"
  }
}
```

### Analytics API Documentation

#### GET /api/analytics
**Description**: Get comprehensive analytics for user's reviews

**Headers**:
- Authorization: Bearer {clerk_session_token}

**Query Parameters**:
- `days` (optional): Number of days to analyze (default: 30)

**Response**:
```json
{
  "stats": {
    "totalReviews": "number",
    "pendingReviews": "number",
    "repliedReviews": "number",
    "rejectedReviews": "number",
    "avgRating": "number",
    "responseRate": "number",
    "totalReplies": "number",
    "aiGeneratedReplies": "number",
    "editedReplies": "number"
  },
  "sentimentDistribution": {
    "positive": "number",
    "negative": "number",
    "neutral": "number"
  },
  "platformDistribution": "object",
  "ratingDistribution": "array",
  "timeSeriesData": "array",
  "recentReviews": "array"
}
```

### Payment API Documentation

#### POST /api/checkout
**Description**: Create a payment checkout session

**Headers**:
- Authorization: Bearer {clerk_session_token}

**Request Body**:
```json
{
  "plan": "string (starter|growth|business)",
  "billingCycle": "string (monthly|yearly)",
  "userEmail": "string",
  "userName": "string",
  "userId": "string"
}
```

**Response**:
```json
{
  "success": "boolean",
  "checkoutUrl": "string",
  "checkoutId": "string"
}
```

**Error Response**:
```json
{
  "error": "string",
  "demo": "boolean (true if payment system not configured)"
}
```

### Webhook API Documentation

#### POST /api/webhooks/lemonsqueezy
**Description**: Handle Lemon Squeezy webhooks

**Headers**:
- X-Signature: Webhook signature

**Request Body**: Lemon Squeezy webhook payload

**Response**:
```json
{
  "success": "boolean",
  "processed": "string (event type)"
}
```

## UI Components Guide

### Dashboard Components

#### StatCard Component
**Location**: `src/components/ui/StatCard.tsx`

**Props**:
- `title`: Display title
- `value`: Main value
- `subtitle`: Additional information
- `icon`: Lucide icon component
- `trend`: Up/down indicator
- `trendValue`: Trend percentage
- `color`: Color scheme

**Usage Example**:
```jsx
<ModernStatCard
  title="Total Reviews"
  value={stats.totalReviews}
  subtitle="All time reviews"
  icon={MessageSquare}
  color="blue"
  trend="up"
  trendValue={12}
/>
```

#### Chart Components
- **ModernLineChart**: Time series data visualization
- **PlatformDistributionCard**: Platform breakdown
- **SentimentCard**: Sentiment analysis visualization

### Review Components

#### ReviewItem Component
**Location**: `src/components/ui/ReviewItem.tsx`

**Props**:
- `review`: Review object
- `onReply`: Reply callback function
- `onApprove`: Approval callback
- `onReject`: Rejection callback

#### Review Management Features
- Bulk selection and actions
- Filtering and sorting
- Status management
- Platform-specific styling

### 3D Visualization Components

#### AIBrainVisualization
**Location**: `src/components/3d/AIBrainVisualization.tsx`

**Features**:
- Interactive 3D brain visualization
- Animated neural network nodes
- Real-time data visualization
- Performance optimized for web

#### DynamicBackground
**Location**: `src/components/DynamicBackground.tsx`

**Features**:
- Animated gradient background
- Performance optimized
- Mobile responsive
- GPU acceleration

### Chrome Extension Components

#### Popup Interface
- Platform detection display
- Review preview
- Tone selection
- Language selection
- Auto-copy toggle
- Reply generation

#### Content Script UI
- AI Reply buttons on reviews
- Modal for generated replies
- Regenerate functionality
- Copy to clipboard
- Loading states

---

This comprehensive documentation covers all aspects of the AutoReview AI system, including the Chrome extension functionality, payment system, API endpoints, and development guidelines. The documentation is designed to be ultra-high level with detailed explanations for each component and feature of the application.