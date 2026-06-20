'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Sparkles, ArrowUpRight } from 'lucide-react'
import { getPlan } from '@/lib/plans'

interface MeData {
  aiCredits: number
  agnesCredits: number
  planType: string
}

/**
 * Shows the user's two monthly credit balances (LongCat + Agnes search/vision)
 * with an Upgrade link. Used in the chat header and the floating chatbot widget.
 * `refreshKey` can be bumped by the parent after a message to re-fetch balances.
 */
export default function CreditPills({
  className = '',
  refreshKey = 0,
  compact = false,
}: {
  className?: string
  refreshKey?: number
  compact?: boolean
}) {
  const [data, setData] = useState<MeData | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/user/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setData(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [refreshKey])

  if (!data) return null
  const plan = getPlan(data.planType)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        title="LongCat credits remaining this month"
        className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[10px] font-black text-violet-200"
      >
        <Zap className="h-3 w-3" />
        {data.aiCredits}
        {!compact && <span className="text-white/30">/{plan.credits}</span>}
      </span>
      <span
        title="Agnes search & vision credits remaining this month"
        className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-200"
      >
        <Sparkles className="h-3 w-3" />
        {data.agnesCredits}
        {!compact && <span className="text-white/30">/{plan.agnesCredits}</span>}
      </span>
      <Link
        href="/subscription"
        className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white transition-colors hover:bg-white/20"
      >
        Upgrade <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
