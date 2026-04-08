# 🔒 SECURITY: Environment Variables

## ⚠️ CRITICAL SECURITY NOTICE

**NEVER commit `.env.local` or any `.env` files containing secrets to git!**

This file contains sensitive API keys and credentials that could compromise your entire application if exposed.

---

## 📋 Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local`

3. **Verify it's ignored:**
   ```bash
   git check-ignore .env.local
   # Should output: .env.local
   ```

---

## 🔐 Required Environment Variables

### Authentication (Required)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Get from https://dashboard.clerk.com
- `CLERK_SECRET_KEY` - Get from https://dashboard.clerk.com

### Database (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Get from https://supabase.com/dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Get from https://supabase.com/dashboard
- `DATABASE_URL` - PostgreSQL connection string

### Encryption (Required)
- `ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`

### AI Services (Required)
- `LONGCAT_AI_API_KEY` - Get from https://longcat.chat

### Optional Services
- `LEMONSQUEEZY_API_KEY` - For payments
- `RESEND_API_KEY` - For emails
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` - For Facebook OAuth

---

## 🚨 If You Accidentally Committed Secrets

**Act immediately:**

1. **Revoke all exposed keys** from their respective dashboards
2. **Generate new keys** for all services
3. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. **Force push** (if you've already pushed):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```
5. **Update `.env.local`** with new keys

---

## ✅ Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.local` is NOT tracked by git
- [ ] All team members have their own `.env.local`
- [ ] Production secrets are in Vercel/hosting environment variables
- [ ] No secrets are hardcoded in source code
- [ ] API keys are rotated regularly

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Last Updated:** 2026-04-08  
**Security Level:** CRITICAL
