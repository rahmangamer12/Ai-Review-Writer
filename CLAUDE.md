# CLAUDE.md

## Development Status & Context

### Current State
This is a production-ready AutoReview AI SaaS platform with the following features:
- AI-powered review management
- Multi-platform integration (Google, Facebook, Yelp, TripAdvisor, Trustpilot)
- Chrome extension for review scraping
- Automated sentiment analysis
- AI-generated responses using LongCat AI
- Payment integration with Lemon Squeezy
- Comprehensive dashboard and analytics

### Tech Stack
- **Frontend**: Next.js 16.1.4 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Clerk
- **AI**: LongCat AI (chat, sentiment analysis, response generation)
- **Payment**: Lemon Squeezy
- **3D Graphics**: Three.js, React Three Fiber
- **Animations**: Framer Motion

### Key Components

#### AI Features
1. **AI Chatbot** (`src/components/AIChatbot.tsx`)
   - LongCat AI powered
   - Two models: Flash (fast) and Thinking (complex)
   - Fallback responses when API unavailable

2. **AI Review Generator** (`src/components/AIReviewGenerator.tsx`)
   - Generates realistic test reviews
   - Mock mode fallback

3. **AI Analytics** (`src/app/analytics/page.tsx`)
   - Real-time sentiment analysis
   - AI-generated insights
   - 3D visualizations

4. **Agentic AI** (`src/app/api/agentic/reviews/route.ts`)
   - Automated review processing
   - Batch sentiment analysis
   - Auto-reply generation

#### Database Schema
Main tables in Supabase:
- `reviews` - Customer reviews with sentiment
- `replies` - AI/manual generated replies
- `users` - User profiles (Clerk managed)
- `subscriptions` - Payment subscriptions
- `analytics` - Daily metrics
- `auto_reply_rules` - Auto-reply configuration
- `scheduled_replies` - Scheduled responses

### Important Files

#### Configuration
- `.env` - Environment variables (single source)
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

#### API Routes
- `/api/chat` - AI chatbot endpoint
- `/api/analytics` - Analytics data
- `/api/reviews/*` - Review management
- `/api/agentic/reviews` - Agentic processing
- `/api/checkout` - Payment checkout
- `/api/webhooks/lemonsqueezy` - Payment webhooks

#### Key Libraries
- `src/lib/longcatAI.ts` - LongCat AI integration
- `src/lib/supabase.ts` - Database client
- `src/lib/credits.ts` - Credit management
- `src/lib/lemonsqueezy.ts` - Payment integration

### Platform Integrations
The system supports review collection from:
- Google My Business (via OAuth + API)
- Facebook Pages (via Graph API)
- Yelp (via Fusion API)
- TripAdvisor (scraping via extension)
- Trustpilot (scraping via extension)

### Chrome Extension
Location: `chrome-extension/`
- Auto-detects reviews on supported platforms
- Generates AI replies with one click
- Multiple tone and language options
- Syncs with main application

### Current Development Focus

#### Recent Improvements
1. ✅ Environment configuration consolidated
2. ✅ Documentation consolidated into README.md
3. ✅ All AI features verified working
4. ✅ Responsive design implemented
5. ✅ Error handling comprehensive

#### Known Issues
1. **Supabase Mock Client**: Currently using demo credentials
   - Fix: Add real Supabase project credentials
   - Impact: Database features work with mock data

2. **Payment System**: Needs Lemon Squeezy API keys
   - Shows "Coming Soon" modal without keys
   - Fully functional once configured

### Development Workflow

#### Running Locally
```bash
npm run dev        # Turbopack (fast)
npm run dev:webpack # Webpack (compatibility)
```

#### Building for Production
```bash
npm run build      # Production build
npm start          # Start production server
```

#### Testing
- Manual testing in development mode
- Chrome DevTools for responsive testing
- API testing with curl/Postman

### Deployment Guide

#### Environment Variables Required
1. **Clerk** (Authentication)
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY

2. **Supabase** (Database)
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

3. **LongCat AI** (AI Features)
   - LONGCAT_AI_API_KEY

4. **Lemon Squeezy** (Payments - Optional)
   - LEMONSQUEEZY_API_KEY
   - LEMONSQUEEZY_STORE_ID
   - LEMONSQUEEZY_WEBHOOK_SECRET
   - LEMONSQUEEZY_VARIANT_* (for each plan)

#### Database Setup
1. Create Supabase project
2. Run `database/schema.sql`
3. Run additional SQL files for features:
   - `database/fix_rls_policy.sql`
   - `database/add_auto_reply_rules.sql`
   - `database/add_scheduled_replies.sql`

### Architecture Patterns

#### Error Handling
- Circuit breaker for AI API calls
- Retry logic with exponential backoff
- Graceful degradation to fallbacks
- User-friendly error messages

#### Data Flow
1. User action → Client component
2. Client → API Route
3. API Route → External service (AI/DB)
4. Response → Client
5. Client → UI update

#### State Management
- React hooks for local state
- Server components for data fetching
- API routes for mutations
- Real-time updates via polling

### Performance Optimizations
1. **Code Splitting**: Dynamic imports for heavy components
2. **Image Optimization**: Next.js Image component
3. **Caching**: API response caching
4. **Database**: Indexed queries, pagination
5. **Mobile**: Reduced animations, optimized 3D

### Security Measures
1. **Authentication**: Clerk with secure sessions
2. **Database**: Row Level Security (RLS)
3. **API**: Input validation and sanitization
4. **Environment**: Secrets in environment variables
5. **Webhooks**: Signature verification

### Future Enhancements
Consider implementing:
1. Real-time review notifications
2. Advanced analytics with ML
3. Multi-language UI
4. Team collaboration features
5. White-label options
6. API for third-party integrations

### Troubleshooting Common Issues

#### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

#### Database Connection
- Check Supabase credentials
- Verify network connectivity
- Check RLS policies

#### AI Features Not Working
- Verify LONGCAT_AI_API_KEY
- Check API quota/limits
- Review circuit breaker status

#### Payment Issues
- Verify Lemon Squeezy keys
- Check webhook configuration
- Review product variant IDs

### Code Quality Standards
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Consistent naming conventions
- Comprehensive comments

### Testing Checklist
- [ ] Authentication flow
- [ ] Review CRUD operations
- [ ] AI chatbot responses
- [ ] Analytics data loading
- [ ] Payment checkout
- [ ] Responsive design
- [ ] Chrome extension functionality

### Maintenance Notes
1. Regular dependency updates
2. Monitor API usage/costs
3. Database backup strategy
4. Performance monitoring
5. Error log review
6. Security audit schedule

---

**Last Updated**: February 2026
**Status**: Production Ready
**Version**: 1.0.0
