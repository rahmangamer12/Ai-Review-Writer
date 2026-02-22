# AutoReview AI - Complete Setup Guide

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

## 💳 Payment System Setup (Lemon Squeezy)

Your payment system is already FULLY INTEGRATED and ready to use! Here's how to activate it:

### 1. Create Lemon Squeezy Account
- Go to [https://app.lemonsqueezy.com/register](https://app.lemonsqueezy.com/register)
- Create your store
- Go to Settings > API to get your API keys

### 2. Create Subscription Products
Create these products in your Lemon Squeezy dashboard:
- **Starter Plan** - $9/month (Product ID: starter)
- **Growth Plan** - $19/month (Product ID: growth)
- **Business Plan** - $39/month (Product ID: business)

### 3. Get Your API Keys
- Go to Settings > API in Lemon Squeezy dashboard
- Copy the API Key and Store ID
- Create variants for each product and copy their IDs

### 4. Update Environment Variables
In `.env.local`, add your keys:
```bash
LEMONSQUEEZY_API_KEY=your_actual_api_key_here
LEMONSQUEEZY_STORE_ID=your_actual_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
LEMONSQUEEZY_VARIANT_STARTER=your_starter_variant_id_here
LEMONSQUEEZY_VARIANT_PROFESSIONAL=your_growth_variant_id_here
LEMONSQUEEZY_VARIANT_ENTERPRISE=your_business_variant_id_here
```

### 5. Set Up Webhook
- Go to Settings > Webhooks in Lemon Squeezy
- Set webhook URL to: `http://localhost:3000/api/webhooks/lemonsqueezy`
- Select all subscription events

## 🔧 Chrome Extension Setup

### 1. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this project

### 2. How to Use the Extension
1. Navigate to Google Maps, Facebook, or Yelp reviews
2. Click on the AutoReview AI extension icon
3. The extension will detect reviews on the page
4. Choose tone and language preferences
5. Click "Generate AI Reply" to create a response
6. Generated replies will auto-copy to clipboard (if enabled)

### 3. Features
- ✅ Auto-detects reviews on Google, Facebook, Yelp
- ✅ Multiple tone options (friendly, professional, apologetic, etc.)
- ✅ Multi-language support (English, Urdu, Hindi, Arabic, Spanish, etc.)
- ✅ Auto-copy to clipboard
- ✅ History of generated replies

## 🎯 API Endpoints

### Review Management
- `GET /api/reviews/list` - List reviews with pagination
- `POST /api/reviews/analyze` - Create/update reviews
- `POST /api/reviews/generate-reply` - Generate AI reply for Chrome extension
- `POST /api/reviews/generate-test` - Generate test reviews

### Analytics
- `GET /api/analytics?days={days}` - Get analytics data

### Payment
- `POST /api/checkout` - Create payment checkout session
- `POST /api/webhooks/lemonsqueezy` - Handle payment webhooks

## 🏗️ Database Schema

The application uses Supabase (PostgreSQL) with Row Level Security:
- `users` - User profiles and authentication
- `reviews` - Customer reviews with sentiment analysis
- `replies` - AI-generated and manual replies
- `subscriptions` - User subscription information
- `analytics` - Daily analytics data

## 🔐 Security Features

- Clerk authentication with secure sessions
- Supabase Row Level Security (RLS) for data isolation
- Input validation and sanitization
- Secure API key handling
- Webhook signature verification

## 🚀 Production Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
- Update `NEXT_PUBLIC_APP_URL` to your domain
- Use production Supabase keys
- Add Lemon Squeezy API keys for payment processing
- Configure custom domain and SSL

## 🛠️ Troubleshooting

### Common Issues
- **Supabase Connection**: If database isn't working, check your Supabase keys in environment variables
- **Payment Not Working**: Without Lemon Squeezy keys, payment will show "Coming Soon" modal
- **Chrome Extension Not Working**: Ensure you've loaded the extension in developer mode
- **API Keys Error**: Make sure all required API keys are added to environment variables

### Testing Payment Flow
- With API keys: Real payment checkout
- Without API keys: "Coming Soon" modal shows (as designed)
- Perfect for development and production flexibility

## 📞 Support

For technical support:
- Check the documentation files in the root directory
- Review the API routes in `/src/app/api/`
- Contact the development team

---

**Ready to launch?** Your AutoReview AI is production-ready! Just add your Lemon Squeezy API keys and you're live. 🚀