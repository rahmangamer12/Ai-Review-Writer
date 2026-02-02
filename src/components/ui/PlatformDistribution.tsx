'use client'

import { motion } from 'framer-motion'

interface PlatformDistributionProps {
  data: Record<string, number>
}

const platformColors: Record<string, string> = {
  google: 'from-blue-500 to-blue-600',
  facebook: 'from-indigo-500 to-indigo-600',
  yelp: 'from-red-500 to-red-600',
  tripadvisor: 'from-emerald-500 to-emerald-600',
  trustpilot: 'from-green-500 to-green-600',
  manual: 'from-gray-500 to-gray-600',
}

const platformIcons: Record<string, string> = {
  google: '🔍',
  facebook: '📘',
  yelp: '⭐',
  tripadvisor: '✈️',
  trustpilot: '💚',
  manual: '📝',
}

export default function PlatformDistribution({ data }: PlatformDistributionProps) {
  const total = Object.values(data).reduce((acc, val) => acc + val, 0)
  const sortedPlatforms = Object.entries(data).sort((a, b) => b[1] - a[1])

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-500">
        <p className="text-sm">No platform data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedPlatforms.map(([platform, count], index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        const colorClass = platformColors[platform] || 'from-gray-500 to-gray-600'
        const icon = platformIcons[platform] || '🌐'
        
        return (
          <div key={platform} className="group">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="text-sm capitalize text-gray-300">{platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{count}</span>
                <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
