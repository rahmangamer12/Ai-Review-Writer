'use client'

import { motion } from 'framer-motion'

interface SentimentData {
  positive: number
  negative: number
  neutral: number
}

interface SentimentChartProps {
  data: SentimentData
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const total = data.positive + data.negative + data.neutral
  
  const segments = [
    { label: 'Positive', value: data.positive, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { label: 'Neutral', value: data.neutral, color: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: 'Negative', value: data.negative, color: 'bg-rose-500', textColor: 'text-rose-400' },
  ]

  return (
    <div className="space-y-4">
      {/* Progress bars */}
      <div className="space-y-3">
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0
          
          return (
            <div key={segment.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{segment.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${segment.textColor}`}>{segment.value}</span>
                  <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${segment.color}`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-800">
        {segments.map((segment) => (
          <div key={segment.label} className="text-center">
            <p className={`text-2xl font-bold ${segment.textColor}`}>{segment.value}</p>
            <p className="text-xs text-gray-500">{segment.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
