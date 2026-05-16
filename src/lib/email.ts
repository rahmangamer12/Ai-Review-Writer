import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const APP_NAME = 'AutoReview AI'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app'

// ─── Shared Email Styles ───────────────────────────────────────────────────────

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a14;
  margin: 0; padding: 0;
`

const containerStyles = `
  max-width: 600px; margin: 0 auto; padding: 40px 24px;
`

const cardStyles = `
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 24px;
`

const btnStyles = `
  display: inline-block;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  color: white !important;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.3px;
  margin-top: 24px;
`

const footerStyles = `
  text-align: center;
  color: rgba(255,255,255,0.3);
  font-size: 12px;
  padding: 24px 0 0;
`

// ─── Email Templates ───────────────────────────────────────────────────────────

function welcomeEmailHtml(name: string): string {
  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Welcome to AutoReview AI</title></head>
  <body style="${baseStyles}">
    <div style="${containerStyles}">
      <!-- Header -->
      <div style="text-align:center; padding-bottom: 32px;">
        <div style="font-size: 36px; margin-bottom: 8px;">✨</div>
        <h1 style="color:#fff; font-size: 28px; margin: 0; background: linear-gradient(135deg, #7c3aed, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Welcome to AutoReview AI
        </h1>
        <p style="color: rgba(255,255,255,0.5); margin: 8px 0 0; font-size: 15px;">Your AI-powered review management platform</p>
      </div>

      <!-- Card -->
      <div style="${cardStyles}">
        <p style="color: rgba(255,255,255,0.8); font-size: 16px; margin: 0 0 16px;">
          Hi <strong style="color: #fff;">${name}</strong> 👋
        </p>
        <p style="color: rgba(255,255,255,0.6); line-height: 1.7; margin: 0 0 24px;">
          You're now part of <strong style="color:#a78bfa">AutoReview AI</strong> — the smartest way to manage your Google, Yelp, and Trustpilot reviews using the power of AI.
        </p>

        <h3 style="color: #a78bfa; margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          🚀 Your Free Plan Includes:
        </h3>
        <table style="width:100%; border-collapse: collapse;">
          ${[
            ['💎', '20 AI Credits/month', 'Free forever'],
            ['🔗', '1 Platform Connection', 'Google, Yelp, etc.'],
            ['🤖', 'AI Chatbot (Sarah)', 'Available 24/7'],
            ['📊', 'Basic Dashboard', 'Analytics included'],
          ].map(([icon, title, desc]) => `
          <tr>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.5); font-size: 18px; width: 32px;">${icon}</td>
            <td style="padding: 8px 12px; color: white; font-weight: 500; font-size: 14px;">${title}</td>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.4); font-size: 13px;">${desc}</td>
          </tr>`).join('')}
        </table>

        <div style="text-align: center;">
          <a href="${APP_URL}/dashboard" style="${btnStyles}">
            Open Your Dashboard →
          </a>
        </div>
      </div>

      <div style="${footerStyles}">
        <p>You received this because you signed up at AutoReview AI.<br>
        <a href="${APP_URL}" style="color: #7c3aed; text-decoration: none;">${APP_URL}</a></p>
      </div>
    </div>
  </body></html>`
}

function upgradedEmailHtml(name: string, plan: string, credits: number): string {
  const planColors: Record<string, string> = {
    starter: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    growth: 'linear-gradient(135deg, #a855f7, #ec4899)',
    professional: 'linear-gradient(135deg, #a855f7, #ec4899)',
    business: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    enterprise: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  }
  const gradient = planColors[plan] || 'linear-gradient(135deg, #7c3aed, #9333ea)'
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1)

  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Plan Upgraded!</title></head>
  <body style="${baseStyles}">
    <div style="${containerStyles}">
      <div style="text-align:center; padding-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h1 style="color:#fff; font-size: 26px; margin: 0;">Payment Successful!</h1>
        <p style="color: rgba(255,255,255,0.5); margin: 8px 0 0; font-size: 15px;">Your account has been upgraded</p>
      </div>

      <div style="${cardStyles}">
        <p style="color: rgba(255,255,255,0.8); font-size: 16px; margin: 0 0 20px;">
          Hi <strong style="color:#fff;">${name}</strong>, welcome to the <strong style="background: ${gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${planName} Plan</strong>! 🚀
        </p>

        <!-- Plan Badge -->
        <div style="background: ${gradient}; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: white;">${credits.toLocaleString()}</div>
          <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px;">AI Credits Added to Your Account</div>
        </div>

        <p style="color: rgba(255,255,255,0.6); line-height: 1.7; margin: 0 0 24px;">
          Your credits are ready to use! Ask Sarah AI to draft replies, analyze sentiment, or review your platform performance.
        </p>

        <div style="text-align: center;">
          <a href="${APP_URL}/dashboard" style="${btnStyles}">
            Start Using Your Credits →
          </a>
        </div>
      </div>

      <div style="${footerStyles}">
        <p>Need help? Reply to this email — we're here 24/7.<br>
        <a href="${APP_URL}" style="color: #7c3aed; text-decoration:none;">${APP_URL}</a></p>
      </div>
    </div>
  </body></html>`
}

function lowCreditsEmailHtml(name: string, creditsLeft: number, plan: string): string {
  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Low Credits Warning</title></head>
  <body style="${baseStyles}">
    <div style="${containerStyles}">
      <div style="text-align:center; padding-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
        <h1 style="color: #f59e0b; font-size: 26px; margin: 0;">You're Running Low on Credits</h1>
        <p style="color: rgba(255,255,255,0.5); margin: 8px 0 0; font-size: 15px;">Only <strong style="color: #f59e0b;">${creditsLeft} credits</strong> remaining</p>
      </div>

      <div style="${cardStyles}">
        <p style="color: rgba(255,255,255,0.8); font-size: 16px; margin: 0 0 20px;">
          Hi <strong style="color:#fff;">${name}</strong>,
        </p>
        <p style="color: rgba(255,255,255,0.6); line-height: 1.7; margin: 0 0 24px;">
          You only have <strong style="color: #f59e0b;">${creditsLeft} AI credits</strong> left on your <strong style="color:#fff;">${plan} plan</strong>. 
          Upgrade now to keep using Sarah AI without interruption.
        </p>

        ${plan === 'free' ? `
        <div style="background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #a78bfa; margin: 0 0 12px; font-size: 15px;">Starter Plan — $9/month</h3>
          <ul style="color: rgba(255,255,255,0.6); padding-left: 20px; margin: 0; line-height: 2;">
            <li>100 AI Credits/month</li>
            <li>3 Platform Connections</li>
            <li>Analytics Dashboard</li>
            <li>Priority Support</li>
          </ul>
        </div>` : ''}

        <div style="text-align: center;">
          <a href="${APP_URL}/subscription" style="${btnStyles}">
            Upgrade Your Plan →
          </a>
        </div>
      </div>

      <div style="${footerStyles}">
        <p><a href="${APP_URL}/subscription" style="color: #7c3aed; text-decoration:none;">Manage your plan</a> · 
        <a href="${APP_URL}" style="color: #7c3aed; text-decoration:none;">${APP_URL}</a></p>
      </div>
    </div>
  </body></html>`
}

function newReviewsEmailHtml(name: string, count: number, platform: string, avgRating: number): string {
  const stars = '⭐'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating))

  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>New Reviews Alert</title></head>
  <body style="${baseStyles}">
    <div style="${containerStyles}">
      <div style="text-align:center; padding-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🔔</div>
        <h1 style="color:#fff; font-size: 26px; margin: 0;">New Reviews Alert!</h1>
        <p style="color: rgba(255,255,255,0.5); margin: 8px 0 0; font-size: 15px;">${count} new review${count > 1 ? 's' : ''} from ${platform}</p>
      </div>

      <div style="${cardStyles}">
        <p style="color: rgba(255,255,255,0.8); font-size: 16px; margin: 0 0 20px;">
          Hi <strong style="color:#fff;">${name}</strong>,
        </p>

        <div style="display:flex; align-items:center; gap:16px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 40px;">📊</div>
          <div>
            <div style="color: white; font-size: 22px; font-weight: 700;">${count} New Review${count > 1 ? 's' : ''}</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 4px;">from <strong style="color:#a78bfa">${platform}</strong></div>
            <div style="font-size: 18px; margin-top: 6px;">${stars} <span style="color: rgba(255,255,255,0.5); font-size:13px;">(avg ${avgRating.toFixed(1)}/5)</span></div>
          </div>
        </div>

        <p style="color: rgba(255,255,255,0.6); line-height:1.7; margin: 0 0 24px;">
          Use Sarah AI to generate professional replies for all ${count} reviews with a single click.
        </p>

        <div style="text-align: center;">
          <a href="${APP_URL}/reviews" style="${btnStyles}">
            View & Reply to Reviews →
          </a>
        </div>
      </div>

      <div style="${footerStyles}">
        <p><a href="${APP_URL}/connect-platforms" style="color: #7c3aed; text-decoration:none;">Manage notifications</a> · 
        <a href="${APP_URL}" style="color: #7c3aed; text-decoration:none;">${APP_URL}</a></p>
      </div>
    </div>
  </body></html>`
}

// ─── Email Sending Functions ───────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME}! Your AI review manager is ready 🚀`,
      html: welcomeEmailHtml(name),
    })
    console.log(`✅ Welcome email sent to ${email}`)
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err)
  }
}

export async function sendUpgradeConfirmationEmail(email: string, name: string, plan: string, credits: number) {
  if (!process.env.RESEND_API_KEY) return
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🎉 You're now on the ${planName} Plan — ${credits} credits added!`,
      html: upgradedEmailHtml(name, plan, credits),
    })
    console.log(`✅ Upgrade email sent to ${email}`)
  } catch (err) {
    console.error('❌ Failed to send upgrade email:', err)
  }
}

export async function sendLowCreditsEmail(email: string, name: string, creditsLeft: number, plan: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `⚠️ Only ${creditsLeft} AI credits left on your account`,
      html: lowCreditsEmailHtml(name, creditsLeft, plan),
    })
    console.log(`✅ Low credits email sent to ${email}`)
  } catch (err) {
    console.error('❌ Failed to send low credits email:', err)
  }
}

export async function sendNewReviewsEmail(email: string, name: string, count: number, platform: string, avgRating: number) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🔔 ${count} new ${platform} review${count > 1 ? 's' : ''} need your attention`,
      html: newReviewsEmailHtml(name, count, platform, avgRating),
    })
    console.log(`✅ New reviews email sent to ${email}`)
  } catch (err) {
    console.error('❌ Failed to send new reviews email:', err)
  }
}
