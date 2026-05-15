# 🤖 AutoReview AI

**AI-Powered Review Management Platform** - Collect, analyze, and respond to customer reviews across Google, Facebook, Yelp, and more — all with AI automation.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

🌐 **Live Demo:** [ai-review-writer.vercel.app](https://ai-review-writer.vercel.app)

---

## ✨ What Is AutoReview AI?

AutoReview AI helps businesses manage customer reviews from multiple platforms in one dashboard. It uses AI to analyze sentiment, generate professional replies, and auto-respond based on rules you set.

### Key Highlights

- **Multi-Platform** — Google, Facebook, Yelp, TripAdvisor, Trustpilot
- **AI Sentiment Analysis** — Automatically detects positive, neutral, negative reviews
- **AI Reply Generation** — Generates professional responses with multiple persona options
- **Auto-Reply Rules** — Set rules to auto-approve positive reviews, queue negative ones for review
- **Chrome Extension** — Generate AI replies directly in your browser
- **PWA Support** — Works offline, installable on mobile
- **Multi-Language** — English + Urdu support
- **Analytics Dashboard** — Track response rates, ratings, sentiment trends

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/rahmangamer12/Ai-Review-Writer.git
cd Ai-Review-Writer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file with these variables:

```env
# Clerk Authentication (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# Supabase Database (https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Database Connection (Supabase > Settings > Database > Connection Pooling)
DATABASE_URL=postgresql://user:password@host:5432/db

# AI Providers
LONGCAT_AI_API_KEY=your_longcat_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key

# Payments - Lemon Squeezy (https://lemonsqueezy.com)
LEMONSQUEEZY_API_KEY=your_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_secret
LEMONSQUEEZY_VARIANT_STARTER=variant_id
LEMONSQUEEZY_VARIANT_PROFESSIONAL=variant_id
LEMONSQUEEZY_VARIANT_ENTERPRISE=variant_id

# Email - Resend (https://resend.com)
RESEND_API_KEY=your_resend_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Security
ENCRYPTION_KEY=generate_with_node_scripts/generate_secrets.js
SCHEDULER_SECRET=generate_with_node_scripts/generate_secrets.js
ADMIN_KEY=generate_with_node_scripts/generate_secrets.js

# Sentry Error Tracking (https://sentry.io) - Optional
SENTRY_DSN=your_sentry_dsn
ENABLE_SENTRY=false
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### Generate Security Keys

```bash
node scripts/generate-secrets.js
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, Tailwind CSS 4, Framer Motion |
| **3D Effects** | Three.js, React Three Fiber |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase (PostgreSQL) with Prisma ORM |
| **Auth** | Clerk |
| **AI** | LongCat AI, Google Generative AI |
| **Payments** | Lemon Squeezy |
| **Email** | Resend |
| **Monitoring** | Sentry |
| **Browser Ext** | Chrome Extension (Manifest V3) |

---

## 📁 Project Structure

```
src/
├── app/                    # Pages & API Routes
│   ├── dashboard/          # Main dashboard
│   ├── reviews/            # Review management
│   ├── analytics/          # Analytics page
│   ├── chat/               # AI chat
│   ├── settings/           # User settings
│   ├── api/                # All API endpoints
│   │   ├── reviews/        # Review CRUD + AI analysis
│   │   ├── chat/           # AI chat endpoint
│   │   ├── platforms/      # Platform integrations
│   │   ├── webhooks/       # Webhook handlers
│   │   ├── auto-reply/     # Auto-reply rules
│   │   ├── scheduler/      # Scheduled tasks
│   │   └── checkout/       # Payment checkout
│   └── proxy.ts            # Auth middleware (Next.js 16)
├── components/             # React components
│   ├── dashboard/          # Dashboard widgets
│   ├── Navigation.tsx      # Sidebar navigation
│   └── ErrorBoundary.tsx   # Error handling
├── lib/                    # Business logic
│   ├── longcatAI.ts        # AI integration
│   ├── supabase.ts         # Database client
│   ├── db.ts               # Prisma client
│   ├── ratelimit.ts        # Rate limiting
│   ├── cache.ts            # In-memory cache
│   ├── sentry.ts           # Error tracking
│   └── platformIntegrations.ts
├── agents/                 # AI agents
database/                   # SQL schemas + migrations
chrome-extension/           # Chrome extension
public/                     # Static assets + PWA files
docs/                       # Documentation
scripts/                    # Utility scripts
```

---

## 🔑 Features

### Review Management
- Import reviews from Google, Facebook, Yelp, TripAdvisor, Trustpilot
- Manual review entry via web UI
- CSV/Excel bulk import
- Review search and filtering

### AI Features
- **Sentiment Analysis** — Automatically classifies reviews as positive/neutral/negative
- **Reply Generation** — AI generates contextual replies with multiple tone options
- **AI Chatbot** — Ask questions about your reviews and get insights
- **Agentic AI** — Batch process reviews automatically

### Automation
- Auto-reply rules based on sentiment, rating, keywords
- Scheduled replies for optimal timing
- Auto-approve positive reviews
- Queue negative reviews for human review

### Analytics
- Response rate tracking
- Average rating trends
- Sentiment distribution charts
- Platform comparison

### Chrome Extension
- Detect reviews on Google, Facebook, Yelp pages
- Generate AI replies in-browser
- Multiple persona options (Professional, Friendly, Desi)

---

## 🛡️ Security

- **Authentication** — Clerk-based session management
- **Database** — Row-Level Security (RLS) policies on all tables
- **API Protection** — Rate limiting on all endpoints
- **Input Validation** — Zod schema validation
- **Encryption** — AES-256-GCM for OAuth tokens
- **CSP Headers** — Content Security Policy configured
- **SSRF Protection** — Domain whitelist on proxy routes
- **Error Tracking** — Sentry integration for production monitoring

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

### Database Setup

1. Create a Supabase project
2. Run `database/schema.sql` in the SQL Editor
3. Enable Row Level Security
4. Add RLS policies from `database/` folder

### Build Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews/analyze` | Analyze review sentiment |
| `POST` | `/api/reviews/generate-reply` | Generate AI reply |
| `GET` | `/api/reviews/list` | List all reviews |
| `POST` | `/api/chat` | AI chat endpoint |
| `POST` | `/api/agentic/reviews` | Batch AI processing |
| `POST` | `/api/auto-reply` | Configure auto-reply rules |
| `POST` | `/api/webhooks/reviews` | Webhook for review ingestion |
| `POST` | `/api/scheduler` | Trigger scheduled tasks |
| `POST` | `/api/checkout` | Create payment checkout |
| `GET` | `/api/health` | Health check |

---

## 📝 License

MIT License — feel free to use this project for learning or commercial purposes.

---

**Built with Next.js 16, React 19, and AI**
