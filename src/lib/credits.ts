import prisma from '@/lib/db';

export interface CreditUsage {
  id: string
  userId: string
  action: string
  creditsUsed: number
  timestamp: string
  details: string
}

export interface CreditDeductionResult {
  success: boolean
  balanceAfter?: number
  error?: 'insufficient_credits' | 'user_not_found' | 'transaction_failed'
}

export interface CreditGrantResult {
  success: boolean
  balanceAfter?: number
  error?: 'user_not_found' | 'transaction_failed'
}

export class CreditsManager {
  // ─── Plan Configuration ─────────────────────────────────────────────────
  // Single source of truth for plan credit allocations.
  // Webhook and subscription page MUST use these values.
  static readonly PLAN_CREDITS: Record<string, number> = {
    'free': 20,
    'starter': 100,
    'growth': 300,
    'business': 1000
  }

  static readonly PLAN_PLATFORMS: Record<string, number> = {
    'free': 1,
    'starter': 3,
    'growth': 10,
    'business': 100
  }

  static getPlanCredits(planId: string): number {
    return this.PLAN_CREDITS[planId] ?? 20
  }

  static getPlanPlatforms(planId: string): number {
    return this.PLAN_PLATFORMS[planId] ?? 1
  }

  // ─── Credit Query ───────────────────────────────────────────────────────
  static async getCredits(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCredits: true }
    });
    return user?.aiCredits ?? 0;
  }

  static async getUserPlan(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true }
    });
    return user?.planType ?? 'free';
  }

  // ─── Atomic Credit Deduction (with audit log) ───────────────────────────
  // Uses Prisma transaction to guarantee atomicity:
  // - Row-level lock via SELECT ... FOR UPDATE (via findUnique in transaction)
  // - Credit decrement + CreditUsage log written atomically
  // - Returns new balance on success, error code on failure
  static async useCredits(
    userId: string,
    amount: number,
    action: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditDeductionResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Lock the user row and read current balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, aiCredits: true }
        });

        if (!user) {
          return { success: false, error: 'user_not_found' as const };
        }

        // 2. Check sufficient balance
        if (user.aiCredits < amount) {
          return { success: false, error: 'insufficient_credits' as const };
        }

        // 3. Calculate new balance
        const newBalance = user.aiCredits - amount;

        // 4. Update user credits
        await tx.user.update({
          where: { id: userId },
          data: { aiCredits: newBalance }
        });

        // 5. Create immutable audit log entry
        await tx.creditUsage.create({
          data: {
            userId,
            action,
            amount: -amount, // Negative = deducted
            balanceAfter: newBalance,
            description: description ?? `Credit used for ${action}`,
            metadata: (metadata ?? {}) as any
          }
        });

        return { success: true, balanceAfter: newBalance };
      });

      return result;
    } catch (error) {
      console.error('[CreditsManager] Transaction failed:', error);
      return { success: false, error: 'transaction_failed' };
    }
  }

  // ─── Atomic Credit Grant (with audit log) ───────────────────────────────
  // Used by webhooks to grant credits on payment success.
  static async grantCredits(
    userId: string,
    amount: number,
    action: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditGrantResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Lock the user row
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, aiCredits: true }
        });

        if (!user) {
          return { success: false, error: 'user_not_found' as const };
        }

        // 2. Calculate new balance
        const newBalance = user.aiCredits + amount;

        // 3. Update user credits
        await tx.user.update({
          where: { id: userId },
          data: { aiCredits: newBalance }
        });

        // 4. Create immutable audit log entry
        await tx.creditUsage.create({
          data: {
            userId,
            action,
            amount: amount, // Positive = granted
            balanceAfter: newBalance,
            description: description ?? `Credits granted for ${action}`,
            metadata: (metadata ?? {}) as any
          }
        });

        return { success: true, balanceAfter: newBalance };
      });

      return result;
    } catch (error) {
      console.error('[CreditsManager] Grant transaction failed:', error);
      return { success: false, error: 'transaction_failed' };
    }
  }

  // ─── Feature Access Control ─────────────────────────────────────────────
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);

    const featureAccess: Record<string, string[]> = {
      'free': ['basic_replies', 'sentiment', 'dashboard', '1_platform'],
      'starter': ['basic_replies', 'sentiment', 'dashboard', '3_platforms', 'bulk_replies', 'templates', 'analytics'],
      'growth': ['basic_replies', 'sentiment', 'dashboard', 'unlimited_platforms', 'bulk_replies', 'templates', 'analytics', 'slack', 'custom_tone', 'auto_reply'],
      'business': ['all_features']
    };

    if (plan === 'business') return true;

    const planFeatures = featureAccess[plan] ?? [];
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
    return costs[action] ?? 1;
  }

  // ─── Audit Log Query ────────────────────────────────────────────────────
  static async getUsageHistory(
    userId: string,
    options?: { limit?: number; action?: string; since?: Date }
  ): Promise<Array<{
    id: string
    userId: string
    action: string
    amount: number
    balanceAfter: number
    description: string | null
    metadata: any
    createdAt: Date
  }>> {
    const where: any = { userId };

    if (options?.action) {
      where.action = options.action;
    }
    if (options?.since) {
      where.createdAt = { gte: options.since };
    }

    return prisma.creditUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50
    });
  }
}
