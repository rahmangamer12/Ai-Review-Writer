'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan'
  delay?: number
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    icon: 'bg-blue-500/20 text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    icon: 'bg-purple-500/20 text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    icon: 'bg-emerald-500/20 text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    icon: 'bg-amber-500/20 text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-600/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    icon: 'bg-rose-500/20 text-rose-400',
    glow: 'shadow-rose-500/20',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    icon: 'bg-cyan-500/20 text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color, delay = 0 }: StatCardProps) {
  const colors = colorVariants[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-3 sm:p-4 md:p-5 lg:p-6 transition-all duration-300 shadow-lg ${colors.glow} backdrop-blur-sm touch-enhanced`}
    >
      {/* Background glow effect */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${colors.bg} opacity-50 blur-2xl`} />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-400 truncate">{title}</p>
            <div className="mt-1 sm:mt-2 flex flex-wrap items-baseline gap-1 sm:gap-2">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-white truncate">{value}</h3>
              {trend && (
                <span className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs md:text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trend.isPositive ? <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" /> : <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-gray-500 truncate">{subtitle}</p>}
          </div>
          <div className={`flex-shrink-0 rounded-lg sm:rounded-xl p-2 sm:p-3 ${colors.icon}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-6 lg:w-6" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
