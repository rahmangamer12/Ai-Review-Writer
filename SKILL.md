# 🧠 AUTOREVIEW AI - PROJECT SKILL & KNOWLEDGE BASE

> **Last Updated:** 2026-02-28  
> **Purpose:** Complete project technical documentation for AI agents  
> **Note:** This is PUBLIC documentation. No personal info here.

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Core Features & Modules](#core-features--modules)
4. [Database Schema](#database-schema)
5. [AI Integration](#ai-integration)
6. [Platform Integrations](#platform-integrations)
7. [PWA Implementation](#pwa-implementation)
8. [Chrome Extension](#chrome-extension)
9. [API Routes Reference](#api-routes-reference)
10. [File Structure](#file-structure)
11. [Environment Variables](#environment-variables)
12. [Deployment & Running](#deployment--running)
13. [Common Issues & Solutions](#common-issues--solutions)
14. [Development Guidelines](#development-guidelines)

---

## 🎯 PROJECT OVERVIEW

**AutoReview AI** is an intelligent, AI-powered review management platform that helps businesses automatically respond to customer reviews across multiple platforms (Google, Facebook, Yelp, TripAdvisor, Trustpilot).

### Key Value Propositions:
- ✅ **AI-Powered Reply Generation** using LongCat AI
- ✅ **Multi-Platform Support** (5+ review platforms)
- ✅ **Sentiment Analysis** for reviews
- ✅ **Auto-Reply Scheduling** with customizable rules
- ✅ **PWA Support** - Works offline, installable
- ✅ **Chrome Extension** for in-browser review scraping
- ✅ **Multi-Language Support** (English, Urdu, Roman Urdu)
- ✅ **Persona-Based Responses** (Professional, Friendly, Empathetic, etc.)
- ✅ **Credit System** with LemonSqueezy payment integration
- ✅ **Real-time Notifications**

### Target Users:
- Local businesses (restaurants, clinics, shops)
- Digital marketing agencies
- Review management professionals
- Business owners managing multiple locations

---

## 🛠️ TECH STACK & ARCHITECTURE

### Frontend:
- **Framework:** Next.js 16.1.4 (App Router, React Server Components)
- **React:** 19.2.3 (Latest with new hooks)
- **TypeScript:** 5.x (Strict mode enabled)
- **Styling:** Tailwind CSS 4 (Latest version)
- **Animations:** Framer Motion 12.29.0
- **3D Graphics:** Three.js + React Three Fiber
- **State Management:** Zustand 5.0.10
- **UI Components:** Custom components + Lucide React icons

### Backend & Services:
- **Runtime:** Node.js (Next.js API Routes)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Clerk 6.36.10
- **AI Provider:** LongCat AI (Custom integration)
- **Payment:** LemonSqueezy
- **Forms:** Formspree 3.0.0

### Build & Development:
- **Package Manager:** npm
- **Bundler:** Next.js with Turbopack/Webpack option
- **Linter:** ESLint 9
- **Deployment:** Vercel-ready (configured)
- **Docker:** Dockerfile + docker-compose included

### Key Architecture Patterns:
1. **Server Components First** - Optimized for performance
2. **Client-Only Wrappers** - Hydration-safe components
3. **API Route Handlers** - RESTful Next.js routes
4. **Service Layer Pattern** - Separated business logic
5. **Type-Safe Database** - Full TypeScript types for Supabase

---

## 🎨 CORE FEATURES & MODULES

### 1. **Dashboard (`src/app/dashboard/page.tsx`)**
- Real-time review statistics
- Sentiment distribution charts
- Platform distribution pie charts
- Recent reviews feed
- Quick action buttons
- Activity trends

**Key Components:**
- `StatCard` - Metric display cards
- `SentimentChart` - Sentiment visualization
- `PlatformDistribution` - Platform breakdown
- `ActivityChart` - Trend analysis
- `ReviewCard` - Individual review display

### 2. **AI Review Generator (`src/components/AIReviewGenerator.tsx`)**
- Real-time AI-powered reply generation
- Persona selection (5 different tones)
- Language detection (English/Urdu/Roman Urdu)
- Sentiment analysis integration
- Editable generated responses
- Copy to clipboard functionality

**AI Models Used:**
- `LongCat-Chat` - General conversation
- `LongCat-Flash-Chat` - Fast responses
- Sentiment analysis engine
- Language detection

### 3. **Auto-Reply System (`src/lib/auto-reply/`)**
- **Scheduler** (`scheduler.ts`) - Automated reply scheduling
- **DB-Backed** (`db-backed-scheduler.ts`) - Persistent scheduling
- Rule-based reply generation
- Time-based scheduling
- Platform-specific rules
- Sentiment-based triggers

**Workflow:**
1. Review arrives → Sentiment analyzed
2. Rules matched → Reply generated
3. Scheduled time → Auto-posted
4. Status updated → User notified

### 4. **Platform Integrations (`src/lib/integrations/`)**
Supported platforms:
- **Google Reviews** (`googleReviews.ts`)
- **Facebook Reviews** (`facebookReviews.ts`)
- **Yelp Reviews** (`yelpReviews.ts`)
- **TripAdvisor** (`tripadvisorReviews.ts`)
- **Trustpilot** (`trustpilotReviews.ts`)

**Integration Manager** (`platformIntegrations.ts`):
- Unified API for all platforms
- OAuth flow handling
- Credential validation
- Review fetching/syncing
- Rate limiting

### 5. **Persona System (`src/lib/desiPersonas.ts`)**
5 Response Personas:
1. **Professional** 🤵 - Formal business tone
2. **Friendly** 😊 - Casual, warm tone
3. **Empathetic** 💙 - Caring, understanding
4. **Enthusiastic** 🎉 - Energetic, excited
5. **Thoughtful** 🌟 - Wise, considerate

Each persona includes:
- Example positive response
- Example negative response
- Tone guidelines
- AI generation prompt

### 6. **Credit Management (`src/lib/credits.ts`)**
- Credit tracking per user
- Usage monitoring
- Billing integration with LemonSqueezy
- Credit deduction on AI usage
- Low balance warnings

### 7. **PWA Features**
**Components:**
- `PWAInstallPrompt.tsx` - Installation banner
- `PWAUpdateNotification.tsx` - Update alerts
- `PWADebugPanel.tsx` - Developer tools

**Service Workers:**
- `/public/sw.js` - Main service worker
- `/public/notification-sw.js` - Push notifications
- Offline caching strategy
- Background sync

**Manifest:** `/public/manifest.json`
- 7 icon sizes (96px to 512px)
- Standalone display mode
- Shortcuts to key pages

### 8. **Chrome Extension (`chrome-extension/`)**
**Features:**
- In-page review scraping
- One-click reply generation
- Platform detection (Google, Facebook, Yelp)
- Direct clipboard copy
- Context menu integration

**Files:**
- `manifest.json` - Extension config
- `background/background.js` - Service worker
- `content/scraper.js` - DOM scraping logic
- `popup/popup.html` - Extension UI

---

## 🗄️ DATABASE SCHEMA

### Tables:

#### **reviews**
```sql
- id (uuid, primary key)
- user_id (text, foreign key to users)
- platform (text: google, facebook, yelp, etc.)
- review_text (text)
- rating (integer: 1-5)
- author_name (text)
- author_photo (text, optional)
- review_date (timestamp)
- status (text: pending, replied, scheduled, ignored)
- sentiment (text: positive, neutral, negative)
- confidence (numeric: 0-1)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **replies**
```sql
- id (uuid, primary key)
- review_id (uuid, foreign key)
- reply_text (text)
- ai_generated (boolean)
- is_edited_by_human (boolean)
- posted_at (timestamp, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **platforms**
```sql
- id (uuid, primary key)
- user_id (text)
- platform_name (text)
- is_connected (boolean)
- credentials (jsonb, encrypted)
- last_sync (timestamp)
- created_at (timestamp)
```

#### **auto_reply_rules**
```sql
- id (uuid, primary key)
- user_id (text)
- name (text)
- platform (text)
- sentiment_filter (text[])
- rating_filter (integer[])
- tone (text)
- enabled (boolean)
- created_at (timestamp)
```

#### **scheduled_replies**
```sql
- id (uuid, primary key)
- review_id (uuid)
- reply_text (text)
- scheduled_time (timestamp)
- status (text: pending, sent, failed, cancelled)
- error_message (text, optional)
- created_at (timestamp)
```

#### **notifications**
```sql
- id (uuid, primary key)
- user_id (text)
- title (text)
- message (text)
- type (text: info, success, warning, error)
- is_read (boolean)
- created_at (timestamp)
```

### Row Level Security (RLS):
- All tables have RLS enabled
- Users can only access their own data
- Service role bypasses RLS for admin operations

---

## 🤖 AI INTEGRATION

### LongCat AI (`src/lib/longcatAI.ts`)

**Class:** `LongCatAI`

**Key Methods:**

1. **`chat(messages, model, options)`**
   - General chat completion
   - Models: `LongCat-Chat`, `LongCat-Flash-Chat`
   - Returns: AI response text

2. **`analyzeSentiment(text)`**
   - Analyzes review sentiment
   - Returns: `{ sentiment: 'positive'|'neutral'|'negative', confidence: 0-1 }`

3. **`generateReviewResponse(reviewText, rating, sentiment, tone, authorName)`**
   - Generates contextual reply
   - Considers persona/tone
   - Returns: `{ response: string, metadata: {...} }`

4. **`detectLanguage(text)`**
   - Detects English/Urdu/Roman Urdu
   - Returns: Language code

**Environment Variables:**
```
LONGCAT_API_KEY=your_api_key
LONGCAT_API_URL=https://api.longcat.ai/v1
```

**Usage Example:**
```typescript
import { longcatAI } from '@/lib/longcatAI'

const sentiment = await longcatAI.analyzeSentiment("Great service!")
const reply = await longcatAI.generateReviewResponse(
  "Great service!",
  5,
  "positive",
  "friendly",
  "John"
)
```

---

## 🔌 PLATFORM INTEGRATIONS

### Google Reviews (`src/lib/integrations/googleReviews.ts`)
- **OAuth:** Google My Business API
- **Scopes:** `business.manage`, `reviews.read`
- **Methods:**
  - `connectGoogle(userId)` - OAuth flow
  - `fetchGoogleReviews(credentials)` - Fetch reviews
  - `postGoogleReply(reviewId, replyText)` - Post reply

### Facebook Reviews (`src/lib/integrations/facebookReviews.ts`)
- **OAuth:** Facebook Graph API
- **Permissions:** `pages_read_engagement`, `pages_manage_posts`
- **Methods:**
  - `connectFacebook(userId)` - OAuth flow
  - `fetchFacebookReviews(credentials)` - Fetch reviews
  - `postFacebookReply(reviewId, replyText)` - Post reply

### Yelp Reviews (`src/lib/integrations/yelpReviews.ts`)
- **API:** Yelp Fusion API
- **Auth:** API Key
- **Methods:**
  - `connectYelp(apiKey)` - API key setup
  - `fetchYelpReviews(businessId)` - Fetch reviews
  - Note: Yelp doesn't allow reply posting via API

### Browser Automation (`src/lib/integrations/browserAutomation.ts`)
- Puppeteer/Playwright for platforms without APIs
- Used for TripAdvisor and Trustpilot
- Fallback for API limitations

---

## 📱 PWA IMPLEMENTATION

### Installation Flow:
1. User visits site
2. Service worker registers (`/sw.js`)
3. `beforeinstallprompt` event captured
4. `PWAInstallPrompt` shows after 2 seconds
5. User clicks "Install"
6. App added to home screen

### Offline Strategy:
- **Cache First:** Static assets (CSS, JS, images)
- **Network First:** API calls (with fallback)
- **Stale While Revalidate:** Reviews data

### Manifest Features:
```json
{
  "display": "standalone",
  "start_url": "/",
  "shortcuts": [
    { "name": "Dashboard", "url": "/dashboard" },
    { "name": "Reviews", "url": "/reviews" },
    { "name": "Analytics", "url": "/analytics" }
  ]
}
```

### Push Notifications:
- Permission request via `PermissionManager.tsx`
- Service worker handles notifications
- Real-time updates for new reviews

---

## 🧩 CHROME EXTENSION

### Architecture:
- **Manifest V3** (latest Chrome extension standard)
- **Service Worker:** Background processing
- **Content Scripts:** DOM injection
- **Popup UI:** Quick actions

### Supported Pages:
- `google.com/maps/*` - Google Reviews
- `business.google.com/*` - GMB Dashboard
- `facebook.com/*/reviews/*` - Facebook Pages
- `yelp.com/*` - Yelp Business Pages

### Workflow:
1. Extension detects review platform
2. Scrapes review content from DOM
3. Sends to AutoReview AI backend
4. AI generates reply
5. Copies to clipboard OR auto-fills

### Installation:
1. Open Chrome → Extensions → Developer Mode
2. Load unpacked → Select `chrome-extension` folder
3. Grant permissions
4. Start using!

---

## 🚏 API ROUTES REFERENCE

### Reviews:
- `POST /api/reviews/analyze` - Analyze sentiment
- `POST /api/reviews/bulk-analyze` - Batch analysis
- `POST /api/reviews/generate-reply` - Generate AI reply
- `GET /api/reviews/list` - List user reviews
- `POST /api/reviews/process` - Process new review
- `POST /api/reviews/generate-test` - Test generation

### Platforms:
- `GET /api/platforms` - List connected platforms
- `POST /api/platforms/google/connect` - Connect Google
- `GET /api/platforms/google/callback` - OAuth callback
- `POST /api/platforms/facebook/connect` - Connect Facebook
- `POST /api/platforms/yelp/connect` - Connect Yelp
- `GET /api/platforms/reviews` - Fetch platform reviews

### Auto-Reply:
- `GET /api/auto-reply` - List rules
- `POST /api/auto-reply` - Create rule
- `PUT /api/auto-reply` - Update rule
- `DELETE /api/auto-reply` - Delete rule

### Scheduler:
- `POST /api/scheduler` - Trigger scheduler manually
- `GET /api/scheduler` - Get scheduler status

### Analytics:
- `GET /api/analytics` - Get analytics data

### Notifications:
- `GET /api/notifications` - List notifications
- `POST /api/notifications/[id]/read` - Mark as read

### Webhooks:
- `POST /api/webhooks/reviews` - Receive platform webhooks
- `POST /api/webhooks/lemonsqueezy` - Payment webhooks

### Agentic:
- `POST /api/agentic/reviews` - Agent-based review processing

### Health:
- `GET /api/health` - System health check

---

## 📁 FILE STRUCTURE

```
autoreview-ai/
├── chrome-extension/         # Chrome extension
│   ├── manifest.json
│   ├── background/
│   ├── content/
│   ├── popup/
│   └── icons/
├── database/                 # SQL schemas
│   ├── schema.sql
│   ├── fix_*.sql
│   └── add_*.sql
├── public/                   # Static assets
│   ├── icons/               # PWA icons
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   └── notification-sw.js
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Landing page
│   │   ├── dashboard/      # Dashboard page
│   │   ├── reviews/        # Reviews management
│   │   ├── analytics/      # Analytics page
│   │   ├── settings/       # User settings
│   │   ├── api/           # API routes
│   │   └── ...            # Other pages
│   ├── components/         # React components
│   │   ├── 3d/            # Three.js components
│   │   ├── charts/        # Data visualization
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── ui/           # UI components
│   │   └── *.tsx         # Shared components
│   ├── lib/               # Utility libraries
│   │   ├── integrations/  # Platform integrations
│   │   ├── auto-reply/    # Auto-reply system
│   │   ├── webhooks/      # Webhook handlers
│   │   ├── longcatAI.ts   # AI integration
│   │   ├── supabase.ts    # Database client
│   │   └── ...           # Other utilities
│   ├── agents/            # AI agents
│   │   └── autoReviewAgent.ts
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript types
├── motivation/            # Career guidance files
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🔐 ENVIRONMENT VARIABLES

### Required Variables:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Provider
LONGCAT_API_KEY=your_longcat_api_key
LONGCAT_API_URL=https://api.longcat.ai/v1

# Payment
LEMONSQUEEZY_API_KEY=your_ls_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# Platform APIs (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_secret
YELP_API_KEY=your_yelp_key

# Email (optional)
FORMSPREE_FORM_ID=your_formspree_id
```

### Development vs Production:
- Dev: Use `.env.local`
- Production: Set in Vercel dashboard or hosting platform

---

## 🚀 DEPLOYMENT & RUNNING

### Local Development:

**Method 1: Quick Start (Windows)**
```bash
# Double-click run-dev.bat
# OR
npm run dev:webpack
```

**Method 2: Standard**
```bash
npm install
npm run dev
```

**Access:** http://localhost:3000

### Build for Production:
```bash
npm run build
npm start
```

### Docker:
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
npm run docker:compose
```

### Vercel Deployment:
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically on push
4. Domain configuration in `vercel.json`

### Important Notes:
- **Turbopack Issues:** Use `npm run dev:webpack` on Windows if path errors occur
- **Memory:** Node is configured for 4GB max (`--max-old-space-size=4096`)
- **Clean Build:** Run `npm run clean` before building if issues arise

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### 1. **Hydration Errors**
**Problem:** React hydration mismatch
**Solution:** 
- Use `<ClientOnly>` wrapper for client-side components
- Add `suppressHydrationWarning` to affected elements
- `HydrationSuppressor` component handles browser extension attributes

### 2. **Supabase Connection**
**Problem:** "Missing Supabase credentials"
**Solution:**
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding variables

### 3. **AI Generation Fails**
**Problem:** LongCat AI errors
**Solution:**
- Check `LONGCAT_API_KEY` is set
- Verify API quota/limits
- Fallback templates activate automatically
- Check console for detailed error logs

### 4. **PWA Not Installing**
**Problem:** Install prompt not showing
**Solution:**
- Ensure HTTPS (required for PWA)
- Check `manifest.json` is accessible
- Clear browser cache
- Check service worker registration in DevTools

### 5. **Chrome Extension Not Working**
**Problem:** Extension not detecting reviews
**Solution:**
- Reload extension in `chrome://extensions`
- Check platform URL matches manifest permissions
- Verify content script injection in DevTools
- Check for DOM selector changes

### 6. **Platform OAuth Fails**
**Problem:** Google/Facebook connection errors
**Solution:**
- Verify client ID/secret
- Check redirect URIs match
- Ensure platform app is approved
- Review required scopes/permissions

### 7. **Build Errors (Windows)**
**Problem:** Path resolution errors
**Solution:**
- Use `npm run dev:webpack` instead of `npm run dev`
- Set `TURBOPACK=0` environment variable
- Run `npm run clean` before building

---

## 📐 DEVELOPMENT GUIDELINES

### Code Style:
- **TypeScript:** Strict mode, explicit types
- **React:** Functional components, hooks
- **Naming:** camelCase (variables), PascalCase (components)
- **Files:** kebab-case for files, PascalCase for components

### Component Patterns:

**Server Component (default):**
```tsx
export default function ServerComponent() {
  return <div>Server rendered</div>
}
```

**Client Component:**
```tsx
'use client'
export default function ClientComponent() {
  const [state, setState] = useState()
  return <div>{state}</div>
}
```

**Client-Only Wrapper:**
```tsx
import ClientOnly from '@/components/ClientOnly'

<ClientOnly>
  <BrowserOnlyComponent />
</ClientOnly>
```

### API Route Pattern:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    // Process request
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Database Queries:
```typescript
import { supabase } from '@/lib/supabase'

// Query with RLS
const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

### AI Integration:
```typescript
import { longcatAI } from '@/lib/longcatAI'

const reply = await longcatAI.generateReviewResponse(
  reviewText,
  rating,
  sentiment,
  tone,
  authorName
)
```

### Testing Locally:
1. **Manual Testing:** Use `/pwa-test` page for PWA features
2. **API Testing:** Use `/api/health` for health checks
3. **Review Testing:** Use `/reviews/add` to add test reviews
4. **Extension Testing:** Load unpacked in Chrome DevTools

### Git Workflow:
1. Feature branch: `git checkout -b feature/your-feature`
2. Commit: Descriptive messages
3. Push: `git push origin feature/your-feature`
4. PR: Create pull request
5. Merge: After review

### Performance Tips:
- Use Server Components by default
- Lazy load heavy components
- Optimize images (Next.js Image component)
- Minimize client-side JavaScript
- Cache static data
- Use React.memo for expensive renders

---

## 🎓 PROJECT LEARNING PATH

### For New Developers:
1. **Start Here:** `START_HERE.txt` - Quick start guide
2. **Read:** `README.md` - Project overview
3. **Explore:** Dashboard page (`src/app/dashboard/page.tsx`)
4. **Understand:** AI integration (`src/lib/longcatAI.ts`)
5. **Practice:** Add a new persona to `desiPersonas.ts`

### For Code Reviews:
1. Check TypeScript strict mode compliance
2. Verify error handling in API routes
3. Ensure RLS policies for database queries
4. Test PWA offline functionality
5. Validate AI generation with fallbacks

### For Feature Development:
1. **Database:** Add migration in `database/` folder
2. **API:** Create route in `src/app/api/`
3. **UI:** Build component in `src/components/`
4. **Logic:** Add service in `src/lib/`
5. **Types:** Update `src/types/database.ts`

---

## 🏆 PROJECT ACHIEVEMENTS

✅ **Full-Stack SaaS Product** - Complete end-to-end solution  
✅ **AI Integration** - Real LongCat AI, not mock data  
✅ **Multi-Platform** - 5+ review platforms supported  
✅ **PWA Ready** - Offline support, installable  
✅ **Chrome Extension** - Browser integration  
✅ **Payment Integration** - LemonSqueezy billing  
✅ **Real-Time Features** - Notifications, auto-reply  
✅ **Production Ready** - Deployment configured  
✅ **Type-Safe** - Full TypeScript coverage  
✅ **Modern Stack** - Latest Next.js 16 + React 19  

---

## 📞 SUPPORT & RESOURCES

### Documentation:
- **PWA Guide:** `PWA_TESTING_GUIDE.md`
- **Troubleshooting:** `PWA_TROUBLESHOOTING_URDU.md`
- **Deployment:** `VERCEL_DEPLOY_GUIDE.md`
- **Quick Start:** `QUICK_START_PWA.txt`

### External Resources:
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Clerk Docs: https://clerk.com/docs
- LongCat AI: https://longcat.ai/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

## 🎯 REMEMBER FOR ALL QUESTIONS:

1. **ALWAYS read this file FIRST** before answering project questions
2. **Check the specific file** mentioned in the question
3. **Refer to actual code** in the workspace
4. **Don't assume** - verify in files
5. **Provide accurate paths** - use exact file locations
6. **Include code snippets** - from actual files
7. **Mention environment variables** - if relevant
8. **Consider context** - database, API, UI, etc.
9. **Check for updates** - this file may be outdated
10. **Be specific** - cite line numbers and file names

---

**Last Updated:** 2026-02-28  
**Version:** 1.0  
**Maintained By:** AutoReview AI Development Team  

---

*This skill document ensures AI agents provide accurate, consistent, and helpful responses about the AutoReview AI project. Always refer to this as the source of truth.*
