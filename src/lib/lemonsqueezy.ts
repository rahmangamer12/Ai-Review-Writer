// Lemon Squeezy payment integration.
// Docs: https://docs.lemonsqueezy.com/help/webhooks
// API: https://docs.lemonsqueezy.com/api

type PaidPlan = 'starter' | 'growth' | 'business'

interface LemonSqueezyConfig {
  apiKey: string
  storeId: string
  variantIds: Record<PaidPlan, string>
}

interface CheckoutOptions {
  userEmail?: string
  userName?: string
  customData?: Record<string, unknown>
}

interface Checkout {
  id: string
  url: string
  expires_at: string
}

export class LemonSqueezy {
  private config: LemonSqueezyConfig
  private baseUrl = 'https://api.lemonsqueezy.com/v1'

  constructor() {
    this.config = {
      apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
      storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
      variantIds: {
        starter: process.env.LEMONSQUEEZY_VARIANT_STARTER || '',
        growth: process.env.LEMONSQUEEZY_VARIANT_GROWTH || process.env.LEMONSQUEEZY_VARIANT_PROFESSIONAL || '',
        business: process.env.LEMONSQUEEZY_VARIANT_BUSINESS || process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE || '',
      },
    }
  }

  isConfigured(): boolean {
    const hasAnyVariant = Object.values(this.config.variantIds).some(Boolean)
    const configured = Boolean(this.config.apiKey && this.config.storeId && hasAnyVariant)

    if (!configured) {
      console.log('Lemon Squeezy is not configured', {
        apiKey: Boolean(this.config.apiKey),
        storeId: Boolean(this.config.storeId),
        configuredVariants: Object.entries(this.config.variantIds)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key),
      })
    }

    return configured
  }

  getMissingForPlan(plan: PaidPlan): string[] {
    const missing: string[] = []
    if (!this.config.apiKey) missing.push('LEMONSQUEEZY_API_KEY')
    if (!this.config.storeId) missing.push('LEMONSQUEEZY_STORE_ID')
    if (!this.config.variantIds[plan]) {
      missing.push(`LEMONSQUEEZY_VARIANT_${plan.toUpperCase()}`)
    }
    if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) missing.push('LEMONSQUEEZY_WEBHOOK_SECRET')
    return missing
  }

  async createCheckout(plan: PaidPlan, options: CheckoutOptions = {}): Promise<Checkout | null> {
    if (!this.isConfigured()) {
      console.error('Lemon Squeezy is not configured. Add API keys and variant IDs to your environment.')
      return null
    }

    const variantId = this.config.variantIds[plan]
    if (!variantId) {
      console.error(`Variant ID for ${plan} plan not found in env`)
      return null
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app'
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              product_options: {
                enabled_variants: [Number(variantId)],
                redirect_url: `${appUrl}/subscription/success?plan=${plan}`,
                receipt_link_url: `${appUrl}/subscription/success?plan=${plan}`,
                receipt_button_text: 'Return to Dashboard',
              },
              checkout_data: {
                email: options.userEmail,
                name: options.userName,
                custom: options.customData,
              },
              expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            },
            relationships: {
              store: {
                data: {
                  type: 'stores',
                  id: this.config.storeId,
                },
              },
              variant: {
                data: {
                  type: 'variants',
                  id: variantId,
                },
              },
            },
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        console.error('Lemon Squeezy API error:', error || response.statusText)
        return null
      }

      const data = await response.json()
      return {
        id: data.data.id,
        url: data.data.attributes.url,
        expires_at: data.data.attributes.expires_at,
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      return null
    }
  }

  verifyWebhook(signature: string, payload: string): boolean {
    if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured')
      return false
    }

    try {
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET)
      hmac.update(payload)
      const digest = hmac.digest('hex')
      const signatureBuffer = Buffer.from(signature, 'hex')
      const digestBuffer = Buffer.from(digest, 'hex')

      if (signatureBuffer.length !== digestBuffer.length) return false
      return crypto.timingSafeEqual(signatureBuffer, digestBuffer)
    } catch (error) {
      console.error('Error verifying webhook:', error)
      return false
    }
  }

  async getSubscription(subscriptionId: string) {
    if (!this.isConfigured()) return null

    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      })

      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching subscription:', error)
      return null
    }
  }

  async cancelSubscription(subscriptionId: string) {
    if (!this.isConfigured()) return false

    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return false
    }
  }

  async getCustomerSubscriptions(email: string) {
    if (!this.isConfigured()) return []

    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions?filter[store_id]=${this.config.storeId}&filter[user_email]=${encodeURIComponent(email)}`,
        {
          headers: {
            Accept: 'application/vnd.api+json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      )

      if (!response.ok) return []
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error)
      return []
    }
  }
}

export const lemonSqueezy = new LemonSqueezy()
