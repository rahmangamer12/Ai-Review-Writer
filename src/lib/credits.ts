import prisma from '@/lib/db';

export interface CreditUsage {
  id: string
  userId: string
  action: string
  creditsUsed: number
  timestamp: string
  details: string
}

export class CreditsManager {
  // Get plan credits allocation
  static getPlanCredits(planId: string): number {
    const planCredits: Record<string, number> = {
      'free': 20,
      'starter': 100,
      'growth': 300,
      'business': 1000
    }
    return planCredits[planId] || 20
  }

  // Get user's current credits from DB
  static async getCredits(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCredits: true }
    });
    return user?.aiCredits || 0;
  }

  // Use credits from DB
  static async useCredits(userId: string, amount: number, action: string, details: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCredits: true }
    });

    if (!user || user.aiCredits < amount) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCredits: {
          decrement: amount
        }
      }
    });

    // We can also add usage logging to a database table if required.
    // For now, the prompt focus is on securing the logic.
    return true;
  }

  static async getUserPlan(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true }
    });
    return user?.planType || 'free';
  }

  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);

    const featureAccess: Record<string, string[]> = {
      'free': ['basic_replies', 'sentiment', 'dashboard', '2_platforms'],
      'starter': ['basic_replies', 'sentiment', 'dashboard', '5_platforms', 'bulk_replies', 'templates', 'analytics'],
      'growth': ['basic_replies', 'sentiment', 'dashboard', 'unlimited_platforms', 'bulk_replies', 'templates', 'analytics', 'slack', 'custom_tone'],
      'business': ['all_features']
    };

    if (plan === 'business') return true;

    const planFeatures = featureAccess[plan] || [];
    return planFeatures.includes(feature) || planFeatures.includes('all_features');
  }

  static getCreditCost(action: string): number {
    const costs: Record<string, number> = {
      'ai_response': 1,
      'review_analysis': 2,
      'bulk_response': 5,
      'sentiment_analysis': 1,
      'auto_reply': 1,
    }
    return costs[action] || 1;
  }
}
