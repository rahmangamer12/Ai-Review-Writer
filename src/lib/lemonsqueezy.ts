// Lemon Squeezy Payment Integration
// Docs: https://docs.lemonsqueezy.com/help/webhooks
// API: https://docs.lemonsqueezy.com/api

interface LemonSqueezyConfig {
  apiKey: string
  storeId: string
  variantIds: {
    starter: string
    professional: string
    enterprise: string
  }
}

interface CheckoutOptions {
  variantId: string
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
        professional: process.env.LEMONSQUEEZY_VARIANT_PROFESSIONAL || '',
        enterprise: process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE || ''
      }
    }
  }

  // Check if Lemon Squeezy is properly configured
  isConfigured(): boolean {
    const configured = !!(
      this.config.apiKey &&
      this.config.storeId &&
      this.config.variantIds.starter
    )
    
    if (!configured) {
      console.log('⚠️ Lemon Squeezy not configured. Missing:', {
        apiKey: !!this.config.apiKey,
        storeId: !!this.config.storeId,
        starter: !!this.config.variantIds.starter
      })
    }
    
    return configured
  }

  // Create a checkout session
  async createCheckout(
    plan: 'starter' | 'professional' | 'enterprise', 
    options: Partial<CheckoutOptions> = {}
  ): Promise<Checkout | null> {
    if (!this.isConfigured()) {
      console.error('❌ Lemon Squeezy is not configured. Please add API keys to .env')
      return null
    }

    const variantId = this.config.variantIds[plan]
    if (!variantId) {
      console.error(`❌ Variant ID for ${plan} plan not found in env`)
      return null
    }

    try {
      console.log('🍋 Creating Lemon Squeezy checkout for plan:', plan)
      
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              product_options: {
                enabled_variants: [parseInt(variantId)],
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app'}/subscription/success?plan=${plan}`,
                receipt_link_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app'}/subscription/success?plan=${plan}`,
                receipt_button_text: 'Return to Dashboard'
              },
              checkout_data: {
                email: options.userEmail,
                name: options.userName,
                custom: options.customData
              },
              expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiry
            },
            relationships: {
              store: {
                data: {
                  type: 'stores',
                  id: this.config.storeId
                }
              },
              variant: {
                data: {
                  type: 'variants',
                  id: variantId
                }
              }
            }
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Lemon Squeezy API error:', error)
        return null
      }

      const data = await response.json()
      console.log('✅ Checkout created:', data.data.id)
      
      return {
        id: data.data.id,
        url: data.data.attributes.url,
        expires_at: data.data.attributes.expires_at
      }
    } catch (error) {
      console.error('❌ Error creating checkout:', error)
      return null
    }
  }

  // Verify webhook signature
  verifyWebhook(signature: string, payload: string): boolean {
    if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      console.error('❌ LEMONSQUEEZY_WEBHOOK_SECRET not configured')
      return false
    }

    try {
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET)
      hmac.update(payload)
      const digest = hmac.digest('hex')
      
      const isValid = signature === digest
      if (!isValid) {
        console.error('❌ Webhook signature mismatch')
      }
      
      return isValid
    } catch (error) {
      console.error('❌ Error verifying webhook:', error)
      return false
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching subscription:', error)
      return null
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return false
    }
  }

  // Get customer subscriptions
  async getCustomerSubscriptions(email: string) {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions?filter[store_id]=${this.config.storeId}&filter[user_email]=${encodeURIComponent(email)}`,
        {
          headers: {
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error)
      return []
    }
  }
}

// Export singleton instance
export const lemonSqueezy = new LemonSqueezy()
