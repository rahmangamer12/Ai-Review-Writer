# SETUP_GUIDE.md — Aap ke liye step-by-step (Roman Urdu)

Yeh woh cheezein hain jo sirf aap kar sakte hain (mujhe aap ke accounts ka access nahi).
Har cheez ke exact steps niche hain. Koi bhi cheez chat me paste mat karna — seedha
Vercel/GitHub me daalna.

---

## 1) GitHub Actions cron ke liye 2 secrets  (5 min — yeh PEHLE karo)

Yeh isliye taake scheduled agents (triage, weekly insights, credit reset) chalein.
**Koi GitHub App / client secret / webhook secret NAHI chahiye** — agar banaya hai to delete kar do.

Steps:
1. GitHub → apna repo `Ai-Review-Writer` → **Settings** (upar tab)
2. Left menu → **Secrets and variables** → **Actions**
3. **New repository secret** → yeh 2 banao:
   - Name: `APP_BASE_URL`  →  Value: `https://ai-review-writer.vercel.app`  (apna real domain, aakhir me `/` nahi)
   - Name: `SCHEDULER_SECRET`  →  Value: (wahi jo Vercel me `SCHEDULER_SECRET` hai)
4. Test: GitHub → **Actions** tab → "Scheduled Jobs (free cron…)" → **Run workflow** → green tick aaye to ho gaya.

> `SCHEDULER_SECRET` kahan se? Yeh aap ne khud banaya tha aur Vercel me daala tha. Na yaad ho to
> naya bana lo (koi 32+ random characters), aur **dono jagah same** kar do (Vercel + GitHub secret).

---

## 2) LemonSqueezy keys  (payments live karne ke liye — woh 0.5 rating)

lemonsqueezy.com par account + store banao, phir:

| Vercel me Env Variable ka NAAM | Kahan se milega |
|---|---|
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy → Settings → **API** → "+" → naya key copy |
| `LEMONSQUEEZY_STORE_ID` | Settings → **Stores** → store ki ID (sirf number, jaise `12345`) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Settings → **Webhooks** → New webhook (niche detail) |
| `LEMONSQUEEZY_VARIANT_STARTER` | Products → Starter product → variant → "Copy variant ID" |
| `LEMONSQUEEZY_VARIANT_GROWTH` | Products → Growth product → variant ID |
| `LEMONSQUEEZY_VARIANT_BUSINESS` | Products → Business product → variant ID |

**Webhook banane ke steps:**
1. LemonSqueezy → Settings → Webhooks → **+**
2. Callback URL: `https://ai-review-writer.vercel.app/api/webhooks/lemonsqueezy`
3. Signing secret: **strong random** banao (jaise `lsq_whk_8fK3pX9mQ2...`) — kamzor password NAHI
   (jaise `Abdulrahman@12345` use mat karna, woh weak + leak ho chuka)
4. Events select karo: `order_created`, `subscription_created`, `subscription_payment_success`,
   `subscription_cancelled`, `subscription_expired`
5. Wahi signing secret Vercel me `LEMONSQUEEZY_WEBHOOK_SECRET` me daal do.

**Store verification:** live payments lene ke liye LemonSqueezy dashboard me store verify karwana
hota hai (woh aap ka business detail maangte hain). Jab tak verify nahi, checkout "maintenance"
dikhayega — yeh by design hai, bug nahi.

Vercel me daalne ke baad → **Redeploy** karna (warna nayi env nahi uthegi).

---

## 3) Google Reviews auto-fetch  (Agentic "Review-Fetcher" ke liye)

Yeh tab chahiye jab aap chahte ho app **khud** Google se reviews le aaye (manual add ke baghair).

### A. Google Cloud project + OAuth
1. https://console.cloud.google.com → upar **Create Project** (naam: AutoReview)
2. Left menu → **APIs & Services** → **Enabled APIs** → **+ Enable APIs** →
   "**Google Business Profile API**" search kar ke enable karo
   (yeh API ke liye Google se alag se access request karna padta hai — niche note)
3. **APIs & Services** → **OAuth consent screen**:
   - User type: **External** → Create
   - App name, support email, developer email bharo
   - **Scopes** → Add → `https://www.googleapis.com/auth/business.manage`
   - **Test users** → apni Gmail add karo (testing ke liye)
4. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**:
   - Type: **Web application**
   - Authorized redirect URI: `https://ai-review-writer.vercel.app/api/platforms/google/callback`
   - Create → **Client ID** aur **Client Secret** copy

### B. Vercel me daalo
| Env NAAM | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | upar wala Client ID |
| `GOOGLE_CLIENT_SECRET` | upar wala Client Secret |

### C. Verification (ZAROORI baat)
- Google Business Profile API ka access Google se **request** karna padta hai (form bharte hain,
  business detail dete hain). Approval me **kuch din–hafte** lag sakte hain. Yeh Google ka process
  hai, app ka bug nahi.
- Jab tak app "Testing" mode me hai, sirf **test users** (jo aap ne add kiye) login kar sakte hain.
- Public ke liye: OAuth consent screen ko **Publish** + Google se verification karwani hogi.

---

## 4) Facebook/Meta Reviews  (optional, Google jaisa)

1. https://developers.facebook.com → **My Apps** → **Create App** → type "Business"
2. App me **Facebook Login** product add karo
3. Settings → **Valid OAuth Redirect URIs**:
   `https://ai-review-writer.vercel.app/api/platforms/facebook/callback`
4. App **Settings → Basic** se: **App ID** aur **App Secret** copy
5. Vercel me daalo:
   | Env NAAM | Value |
   |---|---|
   | `NEXT_PUBLIC_FACEBOOK_APP_ID` | App ID |
   | `FACEBOOK_APP_SECRET` | App Secret |
6. **Business verification** + Page permissions (`pages_read_engagement`, etc.) Meta se approve
   karwane padte hain — yeh bhi Meta ka process hai (kuch din lagte hain).

---

## 5) Brand-Voice (RAG)  — agentic ko aur smart karne ke liye (optional, advanced)

Yeh feature past approved replies se aap ka "tone" seekh kar nayi replies usi style me banata hai.
Iske liye ek **vector database** chahiye. Sab se aasan free option:

1. **Supabase pgvector** (aap ka DB already Supabase hai):
   - Supabase → SQL editor → `create extension if not exists vector;`
   - Phir ek `reply_embeddings` table banani hogi + embeddings provider (jaise OpenAI ya Google
     `text-embedding-004`) ka key chahiye.
2. Ya **Pinecone** (free tier) — alag service.

> Yeh ek bada feature hai (embeddings pipeline + retrieval). Code me iske liye seam tayyar hai
> (`src/lib/ai/provider.ts`), par poora wiring future ka kaam hai. Iske baghair bhi auto-reply,
> triage, aur weekly insights chalte hain.

---

## Quick checklist (priority order)
- [ ] 1. GitHub secrets `APP_BASE_URL` + `SCHEDULER_SECRET`  → crons chalu
- [ ] 2. LemonSqueezy keys + webhook + store verify  → payments live (rating 9.5)
- [ ] 3. Google OAuth + Business Profile API access  → Google reviews auto-fetch
- [ ] 4. (optional) Facebook app + Meta verification  → FB reviews
- [ ] 5. (optional/advanced) Vector store  → Brand-Voice RAG

Har env Vercel me daalne ke baad **Redeploy** karo. Mujhe keys chat me mat bhejna — seedha
Vercel/GitHub me daalo (zyada safe).
