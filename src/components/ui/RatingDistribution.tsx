'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface RatingDistributionProps {
  data: number[] // Array of counts for 1-5 stars
}

export default function RatingDistribution({ data }: RatingDistributionProps) {
  const total = data.reduce((acc, val) => acc + val, 0)
  const maxCount = Math.max(...data, 1)

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars, index) => {
        const count = data[stars - 1] || 0
        const percentage = total > 0 ? (count / total) * 100 : 0
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0
        
        return (
          <div key={stars} className="flex items-center gap-3">
            {/* Star label */}
            <div className="flex w-12 items-center gap-1">
              <span className="text-sm font-medium text-white">{stars}</span>
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            </div>
            
            {/* Progress bar */}
            <div className="flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-gray-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(barWidth, 4)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`h-full rounded-full ${
                    stars >= 4 ? 'bg-emerald-500' :
                    stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>
            
            {/* Count */}
            <div className="w-16 text-right">
              <span className="text-sm text-gray-400">{count}</span>
              <span className="ml-1 text-xs text-gray-600">({percentage.toFixed(0)}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
