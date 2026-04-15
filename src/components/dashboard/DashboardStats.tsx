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

export const ModernStatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, delay = 0 }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    rose: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  }

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    cyan: 'text-cyan-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-4 transition-all duration-300 hover:shadow-2xl touch-enhanced`}
    >
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-${color}-500/20 blur-3xl`} />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          <div className={`rounded-lg sm:rounded-xl ${colorClasses[color] || colorClasses.purple} p-2 border`}>
            <Icon className={`h-5 w-5 ${iconColorClasses[color] || iconColorClasses.purple}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs sm:text-sm font-medium ${
              trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
              trend === 'down' ? 'bg-rose-500/20 text-rose-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" /> :
               trend === 'down' ? <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" /> :
               <Minus className="h-3 w-3 sm:h-4 sm:w-4" />}
              {trendValue}%
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm text-gray-400 truncate">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  )
}
