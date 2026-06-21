import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType<{ className?: string }>
  trend?: string
  trendValue?: string
  color: string
  delay?: number
}

const ACCENT: Record<string, { chip: string; icon: string; glow: string; bar: string }> = {
  blue: { chip: 'bg-blue-500/15 border-blue-400/25', icon: 'text-blue-300', glow: 'bg-blue-500/25', bar: 'from-blue-400 to-cyan-400' },
  purple: { chip: 'bg-violet-500/15 border-violet-400/25', icon: 'text-violet-300', glow: 'bg-violet-500/25', bar: 'from-violet-400 to-fuchsia-400' },
  emerald: { chip: 'bg-emerald-500/15 border-emerald-400/25', icon: 'text-emerald-300', glow: 'bg-emerald-500/25', bar: 'from-emerald-400 to-teal-400' },
  amber: { chip: 'bg-amber-500/15 border-amber-400/25', icon: 'text-amber-300', glow: 'bg-amber-500/25', bar: 'from-amber-400 to-orange-400' },
  rose: { chip: 'bg-rose-500/15 border-rose-400/25', icon: 'text-rose-300', glow: 'bg-rose-500/25', bar: 'from-rose-400 to-pink-400' },
  cyan: { chip: 'bg-cyan-500/15 border-cyan-400/25', icon: 'text-cyan-300', glow: 'bg-cyan-500/25', bar: 'from-cyan-400 to-blue-400' },
}

export const ModernStatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, delay = 0 }: StatCardProps) => {
  const a = ACCENT[color] || ACCENT.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b14] p-4 transition-all duration-300 hover:border-white/15 sm:p-5"
    >
      {/* gradient hairline + hover glow */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.bar} opacity-60`} />
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${a.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${a.chip}`}>
            <Icon className={`h-5 w-5 ${a.icon}`} />
          </div>
          {trend && trendValue && (
            <div className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              trend === 'up' ? 'bg-emerald-500/15 text-emerald-300' :
              trend === 'down' ? 'bg-rose-500/15 text-rose-300' :
              'bg-white/10 text-white/50'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> :
               trend === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" /> :
               <Minus className="h-3.5 w-3.5" />}
              {trendValue}%
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
          <p className="mt-1 truncate text-sm font-medium text-white/55">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-white/35">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  )
}
