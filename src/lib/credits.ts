// Credits management system

export interface CreditUsage {
  id: string
  userId: string
  action: string
  creditsUsed: number
  timestamp: string
  details: string
}

export class CreditsManager {
  private static STORAGE_KEY_PREFIX = 'autoreview-credits-'
  private static USAGE_KEY_PREFIX = 'autoreview-usage-'

  // Get user's current credits - ALWAYS validate against plan
  static getCredits(userId: string): number {
    if (typeof window === 'undefined') return 50

    const profileKey = `autoreview-profile-${userId}`
    const profileData = localStorage.getItem(profileKey)
    const currentPlan = localStorage.getItem('autoreview-plan') || 'free'
    const correctCredits = this.getPlanCredits(currentPlan)

    if (profileData) {
      const profile = JSON.parse(profileData)
      const savedPlan = profile.plan || 'free'
      const savedCredits = typeof profile.credits === 'number' ? profile.credits : correctCredits

      // If plan changed, reset credits to plan default
      if (savedPlan !== currentPlan) {
        console.log(`[CreditsManager] Plan changed from ${savedPlan} to ${currentPlan}, updating credits: ${savedCredits} -> ${correctCredits}`)
        profile.plan = currentPlan
        profile.credits = correctCredits
        localStorage.setItem(profileKey, JSON.stringify(profile))
        return correctCredits
      }

      // If credits don't match plan (and not due to usage), fix them
      // Allow credits to be less than plan max (due to usage), but not more
      if (savedCredits > correctCredits) {
        console.log(`[CreditsManager] Credits (${savedCredits}) exceed plan max (${correctCredits}), fixing...`)
        profile.credits = correctCredits
        localStorage.setItem(profileKey, JSON.stringify(profile))
        return correctCredits
      }

      return savedCredits
    }

    // If no profile exists, create one with correct plan credits
    const newProfile = {
      credits: correctCredits,
      plan: currentPlan,
      joined_date: new Date().toISOString()
    }
    localStorage.setItem(profileKey, JSON.stringify(newProfile))
    return correctCredits
  }

  // Use credits
  static useCredits(userId: string, amount: number, action: string, details: string): boolean {
    if (typeof window === 'undefined') return false

    const profileKey = `autoreview-profile-${userId}`
    const profileData = localStorage.getItem(profileKey)

    if (!profileData) return false

    const profile = JSON.parse(profileData)
    const currentCredits = profile.credits || 0

    if (currentCredits < amount) {
      alert(`⚠️ Insufficient Credits!\n\nYou need ${amount} credits but only have ${currentCredits}.\n\nPlease upgrade your plan to continue.`)
      return false
    }

    // Deduct credits
    profile.credits = currentCredits - amount
    localStorage.setItem(profileKey, JSON.stringify(profile))

    // Log usage
    this.logUsage(userId, action, amount, details)

    return true
  }

  // Log credit usage
  private static logUsage(userId: string, action: string, creditsUsed: number, details: string) {
    const usageKey = `${this.USAGE_KEY_PREFIX}${userId}`
    const existingUsage = localStorage.getItem(usageKey)
    const usageArray: CreditUsage[] = existingUsage ? JSON.parse(existingUsage) : []

    const newUsage: CreditUsage = {
      id: Date.now().toString(),
      userId,
      action,
      creditsUsed,
      timestamp: new Date().toISOString(),
      details
    }

    usageArray.unshift(newUsage) // Add to beginning

    // Keep only last 100 entries
    if (usageArray.length > 100) {
      usageArray.splice(100)
    }

    localStorage.setItem(usageKey, JSON.stringify(usageArray))
  }

  // Get usage history
  static getUsageHistory(userId: string, limit: number = 10): CreditUsage[] {
    if (typeof window === 'undefined') return []

    const usageKey = `${this.USAGE_KEY_PREFIX}${userId}`
    const existingUsage = localStorage.getItem(usageKey)

    if (!existingUsage) return []

    const usageArray: CreditUsage[] = JSON.parse(existingUsage)
    return usageArray.slice(0, limit)
  }

  // Add credits (for upgrades)
  static addCredits(userId: string, amount: number, reason: string) {
    if (typeof window === 'undefined') return

    const profileKey = `autoreview-profile-${userId}`
    const profileData = localStorage.getItem(profileKey)

    if (!profileData) return

    const profile = JSON.parse(profileData)
    profile.credits = (profile.credits || 0) + amount
    localStorage.setItem(profileKey, JSON.stringify(profile))

    // Log the addition
    this.logUsage(userId, 'credit_added', -amount, reason)
  }

  // Set credits (for plan changes)
  static setCredits(userId: string, amount: number, reason: string) {
    if (typeof window === 'undefined') return

    const profileKey = `autoreview-profile-${userId}`
    const profileData = localStorage.getItem(profileKey)

    if (!profileData) return

    const profile = JSON.parse(profileData)
    const oldCredits = profile.credits || 0
    profile.credits = amount
    localStorage.setItem(profileKey, JSON.stringify(profile))

    // Log the change
    this.logUsage(userId, 'credits_set', oldCredits - amount, reason)
  }

  // Get plan credits allocation (Updated Pricing)
  static getPlanCredits(planId: string): number {
    const planCredits: Record<string, number> = {
      'free': 20,
      'starter': 100,
      'growth': 300,
      'business': 1000
    }
    return planCredits[planId] || 20
  }

  // Get user's current plan
  static getUserPlan(userId: string): string {
    if (typeof window === 'undefined') return 'free'

    const profileKey = `autoreview-profile-${userId}`
    const profileData = localStorage.getItem(profileKey)

    if (profileData) {
      const profile = JSON.parse(profileData)
      return profile.plan || 'free'
    }

    return 'free'
  }

  // Check if user has access to a feature based on plan
  static hasFeatureAccess(userId: string, feature: string): boolean {
    const plan = this.getUserPlan(userId)

    const featureAccess: Record<string, string[]> = {
      'free': ['basic_replies', 'sentiment', 'dashboard', '2_platforms'],
      'starter': ['basic_replies', 'sentiment', 'dashboard', '5_platforms', 'bulk_replies', 'templates', 'analytics'],
      'growth': ['basic_replies', 'sentiment', 'dashboard', 'unlimited_platforms', 'bulk_replies', 'templates', 'analytics', 'slack', 'custom_tone'],
      'business': ['all_features']
    }

    if (plan === 'business') return true

    const planFeatures = featureAccess[plan] || []
    return planFeatures.includes(feature) || planFeatures.includes('all_features')
  }

  // Handle plan change with credit adjustment
  static handlePlanChange(userId: string, oldPlan: string, newPlan: string): void {
    if (typeof window === 'undefined') return

    const oldCredits = this.getCredits(userId)
    const newPlanCredits = this.getPlanCredits(newPlan)

    // For upgrades: keep existing credits + add new plan allocation
    // For downgrades: set to new plan allocation
    const isUpgrade = this.isUpgrade(oldPlan, newPlan)

    if (isUpgrade) {
      // Keep existing credits and add the difference
      const creditDifference = newPlanCredits - this.getPlanCredits(oldPlan)
      if (creditDifference > 0) {
        this.addCredits(userId, creditDifference, `Upgraded from ${oldPlan} to ${newPlan}`)
      }
    } else {
      // Downgrade: set to new plan credits (but keep if they have more)
      const finalCredits = Math.max(oldCredits, newPlanCredits)
      this.setCredits(userId, finalCredits, `Changed plan from ${oldPlan} to ${newPlan}`)
    }
  }

  // Check if plan change is an upgrade
  private static isUpgrade(oldPlan: string, newPlan: string): boolean {
    const planHierarchy: Record<string, number> = {
      'free': 0,
      'starter': 1,
      'growth': 2,
      'business': 3
    }
    return (planHierarchy[newPlan] || 0) > (planHierarchy[oldPlan] || 0)
  }

  // Get credit costs for different actions
  static getCreditCost(action: string): number {
    const costs: Record<string, number> = {
      'ai_response': 1,          // 1 credit per AI response
      'review_analysis': 2,      // 2 credits per review analysis
      'bulk_response': 5,        // 5 credits for bulk responses
      'sentiment_analysis': 1,   // 1 credit per sentiment analysis
      'auto_reply': 1,           // 1 credit per auto-reply
    }

    return costs[action] || 1
  }
}
