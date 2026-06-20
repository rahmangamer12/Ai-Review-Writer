import prisma from '@/lib/db';
import { PLANS, getPlan, planHasCapability, type Capability } from '@/lib/plans';

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
  // Derived from the canonical single source of truth in src/lib/plans.ts so
  // pricing, credits, platform caps, and entitlements can never drift apart.
  static readonly PLAN_CREDITS: Record<string, number> = Object.fromEntries(
    Object.values(PLANS).map((p) => [p.id, p.credits])
  )

  static readonly PLAN_PLATFORMS: Record<string, number> = Object.fromEntries(
    Object.values(PLANS).map((p) => [p.id, p.platforms])
  )

  static getPlanCredits(planId: string): number {
    return getPlan(planId).credits
  }

  static getPlanPlatforms(planId: string): number {
    return getPlan(planId).platforms
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
  // Concurrency-safe: the deduction is a single conditional UPDATE
  //   UPDATE "User" SET aiCredits = aiCredits - $n WHERE id = $id AND aiCredits >= $n
  // performed via Prisma `updateMany`. Postgres serializes concurrent updates to
  // the same row and re-evaluates the `>= amount` guard against the latest
  // committed value, so two parallel requests can NEVER double-spend or drive the
  // balance negative (unlike a read-then-write under READ COMMITTED).
  static async useCredits(
    userId: string,
    amount: number,
    action: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditDeductionResult> {
    if (amount <= 0) {
      return { success: false, error: 'transaction_failed' };
    }
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atomic conditional decrement (row-locked guard)
        const updated = await tx.user.updateMany({
          where: { id: userId, aiCredits: { gte: amount } },
          data: { aiCredits: { decrement: amount } },
        });

        // 2. Zero rows affected => either no such user OR not enough credits
        if (updated.count === 0) {
          const exists = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          const err: 'insufficient_credits' | 'user_not_found' = exists
            ? 'insufficient_credits'
            : 'user_not_found';
          return { success: false, error: err };
        }

        // 3. Read the post-update balance (same tx, after our locked write)
        const fresh = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true },
        });
        const newBalance = fresh?.aiCredits ?? 0;

        // 4. Immutable audit log entry
        await tx.creditUsage.create({
          data: {
            userId,
            action,
            amount: -amount, // Negative = deducted
            balanceAfter: newBalance,
            description: description ?? `Credit used for ${action}`,
            metadata: (metadata ?? {}) as any,
          },
        });

        return { success: true, balanceAfter: newBalance };
      });

      return result;
    } catch (error) {
      console.error('[CreditsManager] Transaction failed:', error);
      return { success: false, error: 'transaction_failed' };
    }
  }

  // ─── Refund (used when AI generation fails AFTER deduction) ──────────────
  // Convenience wrapper over grantCredits that records a 'refund' audit entry.
  static async refundCredits(
    userId: string,
    amount: number,
    action: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditGrantResult> {
    return this.grantCredits(
      userId,
      amount,
      action,
      description ?? `Refund for failed ${action}`,
      { ...(metadata ?? {}), refund: true }
    );
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
    if (amount <= 0) {
      return { success: false, error: 'transaction_failed' };
    }
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atomic increment (no read-then-write race)
        const affected = await tx.user.updateMany({
          where: { id: userId },
          data: { aiCredits: { increment: amount } },
        });

        if (affected.count === 0) {
          return { success: false, error: 'user_not_found' as const };
        }

        // 2. Read post-update balance for the audit log
        const fresh = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true },
        });
        const newBalance = fresh?.aiCredits ?? amount;

        // 3. Immutable audit log entry
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
  // Backed by the canonical capability sets in src/lib/plans.ts.
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return planHasCapability(plan, feature as Capability);
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
