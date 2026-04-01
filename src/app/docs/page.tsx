'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, BookOpen, Code, Database, CreditCard, Chrome, Shield, Zap, Star, Users, BarChart3, MessageSquare, Bot, ArrowLeft, Copy, Check, Search } from 'lucide-react'
import { motion } from 'framer-motion'

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('overview')

  const documentationSections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <Star className="w-5 h-5" />,
      content: `
# AutoReview AI - Overview

AutoReview AI is a production-ready, powerful SaaS platform that helps businesses manage and respond to customer reviews using AI. The platform supports multiple review platforms including Google, Facebook, Yelp, and TripAdvisor with mobile-first responsive design and comprehensive analytics.

## Key Features

- **Mobile-First Responsive Design** - Fully optimized for all screen sizes
- **AI-Powered Review Management** - Advanced sentiment analysis and response generation
- **Multi-Platform Integration** - Connect Google, Facebook, Yelp, TripAdvisor
- **Real-Time Analytics** - Comprehensive dashboard with actionable insights
- **Chrome Extension** - Generate replies directly on review platforms
- **Auto-Reply System** - Rules-based automated responses
- **Production-Ready Architecture** - Optimized for scalability and performance
      `
    },
    {
      id: 'chrome-extension',
      title: 'Chrome Extension',
      icon: <Chrome className="w-5 h-5" />,
      content: `
# Chrome Extension Guide

## Architecture
\`\`\`
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
\`\`\`

## How It Works

### 1. Content Script (content/scraper.js)
- Runs on supported platforms (Google Maps, Facebook, Yelp, etc.)
- Detects reviews on the page using platform-specific selectors
- Adds "✨ AI Reply" buttons to each detected review
- Handles real-time review detection (mutation observers)

### 2. Platform Detection
- **Google Maps**: Detects via \`[data-review-id]\` selectors
- **Facebook**: Detects via \`[role="article"]\` selectors
- **Yelp**: Detects via \`.review\` class selectors
- **TripAdvisor**: Detects via \`.review-container\` selectors
- **Trustpilot**: Detects via \`[data-review-id]\` selectors

### 3. Popup Interface (popup/popup.html)
- Shows detected platform
- Displays detected review preview
- Allows tone and language selection
- Generates AI replies
- Auto-copies to clipboard

### 4. API Integration
- Connects to main application's \`/api/reviews/generate-reply\` endpoint
- Uses LongCat AI for response generation
- Handles error states gracefully
      `
    },
    {
      id: 'payment',
      title: 'Payment System',
      icon: <CreditCard className="w-5 h-5" />,
      content: `
# Payment System

## Architecture
\`\`\`
src/lib/lemonsqueezy.ts     # Lemon Squeezy client
src/app/api/checkout/       # Checkout API route
src/app/subscription/       # Subscription page
src/app/api/webhooks/       # Webhook handling
\`\`\`

## Lemon Squeezy Integration

### Configuration
- API key validation
- Store ID verification
- Plan variant IDs mapping
- Webhook secret management

### Checkout Process
1. **Frontend**: User clicks subscription plan
2. **Backend**: \`/api/checkout\` validates plan and checks API configuration
3. **Lemon Squeezy**: Creates checkout session with details
4. **Redirect**: User sent to secure checkout page
5. **Webhook**: Payment confirmation updates user subscription
6. **Database**: Credits updated, subscription status changed

## Subscription Tiers

### Free Plan ($0/month)
- 20 AI responses per month
- 1 platform connection
- Basic dashboard
- Email support
- No credit card required

### Starter Plan ($9/month)
- 100 AI responses per month
- 3 platform connections
- Bulk reply generation
- Response templates
- Analytics dashboard
- All Free features included

### Growth Plan ($19/month)
- 300 AI responses per month
- Unlimited platforms
- Auto-draft mode
- Sentiment reports
- Slack notifications
- Priority support
- All Starter features included

### Business Plan ($39/month)
- 1000 AI responses per month
- Up to 5 team members
- Advanced analytics
- Custom integrations
- API access (coming soon)
- Priority support (4h response)
- All Growth features included
      `
    },
    {
      id: 'api',
      title: 'API Endpoints',
      icon: <Code className="w-5 h-5" />,
      content: `
# API Endpoints

## Review Management API

### \`/api/reviews/list\`
- **Method**: GET
- **Auth**: Required
- **Description**: List reviews with pagination and filters
- **Query Parameters**:
  - \`page\` - Page number
  - \`limit\` - Items per page
  - \`platform\` - Filter by platform
  - \`sentiment\` - Filter by sentiment
  - \`status\` - Filter by status
  - \`search\` - Search in review text

### \`/api/reviews/analyze\`
- **Method**: POST
- **Auth**: Required
- **Description**: Create or update a review
- **Body**:
  - \`content\` - Review text
  - \`rating\` - Star rating (1-5)
  - \`author_name\` - Reviewer name
  - \`author_email\` - Reviewer email
  - \`platform\` - Review platform
  - \`sentiment_label\` - Sentiment classification

### \`/api/reviews/generate-reply\`
- **Method**: POST
- **Auth**: Required
- **Description**: Generate AI reply for a review
- **Body**:
  - \`reviewText\` - Original review text
  - \`rating\` - Star rating
  - \`authorName\` - Reviewer name
  - \`platform\` - Review platform
  - \`tone\` - Reply tone
  - \`language\` - Reply language

### \`/api/reviews/generate-test\`
- **Method**: POST
- **Auth**: Required
- **Description**: Generate test reviews for demonstration
- **Body**:
  - \`count\` - Number of reviews to generate
  - \`platform\` - Review platform
  - \`ratingRange\` - Rating distribution
  - \`businessType\` - Business type for review context

## Analytics API

### \`/api/stats-overview\`
- **Method**: GET
- **Auth**: Required
- **Description**: Get comprehensive analytics data
- **Query Parameters**:
  - \`days\` - Number of days to analyze (default: 30)
  - \`platform\` - Filter by platform (optional)

## Agentic Processing API

### \`/api/agentic/reviews\`
- **Method**: POST
- **Auth**: Required
- **Description**: Run agentic review processing
      `
    },
    {
      id: 'database',
      title: 'Database Schema',
      icon: <Database className="w-5 h-5" />,
      content: `
# Database Schema

## Tables Overview
\`\`\`
- users                  # User accounts and profiles
- reviews                # Customer reviews
- replies                # AI-generated responses
- subscriptions          # User subscriptions
- analytics              # Daily analytics data
- connected_platforms    # Platform connections
- notifications          # User notifications
- ai_learning_data       # AI training data
\`\`\`

## Reviews Table
\`\`\`sql
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
\`\`\`

## Replies Table
\`\`\`sql
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
\`\`\`

## Security Features
- All tables have Row Level Security (RLS) policies
- Users can only access their own data
- Authentication required for all operations
- Secure data isolation
      `
    },
    {
      id: 'security',
      title: 'Security Features',
      icon: <Shield className="w-5 h-5" />,
      content: `
# Security Features

## Authentication Security

### Clerk Integration
- Multi-factor authentication support
- Secure session management
- Role-based permissions
- User impersonation protection
- Secure password policies

### Session Management
- Automatic session expiration
- Secure cookie settings
- CSRF protection
- Session hijacking prevention
- Regular session validation

## Data Security

### Database Security
- Row Level Security (RLS) implemented
- User data isolation
- Encrypted connections
- Access control policies
- Audit logging

### API Security
- Authentication required for protected routes
- Input validation and sanitization
- Rate limiting implemented
- CORS policies configured
- Error message sanitization

## Payment Security

### Lemon Squeezy Security
- Secure payment processing
- PCI compliance
- Webhook signature verification
- Payment data encryption
- Fraud detection

## Chrome Extension Security

### Content Security Policy
- Restricted script execution
- Secure API calls
- Data isolation
- Origin validation
- Permission scope limitation
      `
    },
    {
      id: 'installation',
      title: 'Installation Guide',
      icon: <Zap className="w-5 h-5" />,
      content: `
# Installation Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- Code editor (VS Code recommended)

## Step-by-Step Installation

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd autoreview-ai
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables
Create a \`.env\` file in the root directory with the following content:

\`\`\`env
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
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

### 5. Install Chrome Extension (Optional)
1. Open Chrome and go to \`chrome://extensions/\`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the \`chrome-extension\` folder from the project
      `
    }
  ]

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(text.substring(0, 50))
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const renderMarkdown = (content: string) => {
    const elements: React.ReactNode[] = []
    const lines = content.split('\n')
    let inCodeBlock = false
    let codeContent = ''
    let codeLang = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${i}`} className="bg-[#0a0a0f] border border-white/10 rounded-xl my-5 overflow-hidden shadow-lg w-full max-w-full">
              {codeLang && <div className="bg-white/5 border-b border-white/5 px-4 py-2 text-xs font-mono text-purple-400 capitalize">{codeLang}</div>}
              <pre className="p-4 overflow-x-auto custom-scrollbar text-sm w-full">
                <code className="text-gray-300 font-mono inline-block min-w-full">{codeContent.trimEnd()}</code>
              </pre>
            </div>
          )
          inCodeBlock = false
          codeContent = ''
        } else {
          inCodeBlock = true
          codeLang = line.substring(3).trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        continue
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-2xl sm:text-3xl font-bold text-white mb-6 mt-8 break-words">{line.substring(2)}</h1>)
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-xl sm:text-2xl font-semibold text-white mb-4 mt-8 break-words">{line.substring(3)}</h2>)
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-lg sm:text-xl font-medium text-white mb-3 mt-6 break-words">{line.substring(4)}</h3>)
      } else if (line.startsWith('- ')) {
        elements.push(<li key={i} className="text-gray-300 mb-2 ml-4 list-disc break-words leading-relaxed">{line.substring(2)}</li>)
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(<li key={i} className="text-gray-300 mb-2 ml-4 list-decimal break-words leading-relaxed">{line.replace(/^\d+\.\s/, '')}</li>)
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-4" />)
      } else {
        elements.push(<p key={i} className="text-gray-300 mb-3 leading-relaxed break-words">{line}</p>)
      }
    }
    return elements
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-purple-600/20">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Documentation</h1>
              <p className="text-gray-400">Complete guide to AutoReview AI platform</p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8 glass-card border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Contents</h3>
              <nav className="space-y-2">
                {documentationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-purple-400">{section.icon}</span>
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredSections.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-gray-400">Try adjusting your search query</p>
              </div>
            ) : (
              filteredSections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-12 ${activeSection !== section.id ? 'hidden' : ''}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      {section.icon}
                      {section.title}
                    </h2>
                    <button
                      onClick={() => copyToClipboard(section.content)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {copiedSection === section.content.substring(0, 50) ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="prose prose-invert max-w-none bg-gray-900/50 p-6 rounded-xl border border-white/10">
                    {renderMarkdown(section.content)}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentationPage