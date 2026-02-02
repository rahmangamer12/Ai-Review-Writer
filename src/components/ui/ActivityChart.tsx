'use client'

import { motion } from 'framer-motion'

interface DataPoint {
  date: string
  count: number
  totalRating: number
}

interface ActivityChartProps {
  data: DataPoint[]
  days?: number
}

export default function ActivityChart({ data, days = 30 }: ActivityChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  
  // Get day labels
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
  }

  // Show every Nth label based on days
  const labelInterval = days <= 7 ? 1 : days <= 14 ? 2 : days <= 30 ? 5 : 10

  return (
    <div className="h-64 w-full">
      <div className="flex h-full items-end gap-1">
        {data.map((item, index) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
          const avgRating = item.count > 0 ? (item.totalRating / item.count).toFixed(1) : '0'
          
          return (
            <motion.div
              key={item.date}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ duration: 0.5, delay: index * 0.02 }}
              className="group relative flex-1"
            >
              <div 
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  item.count > 0 
                    ? 'bg-gradient-to-t from-blue-500/50 to-blue-400/80 group-hover:from-blue-400/70 group-hover:to-blue-300' 
                    : 'bg-gray-800/50'
                }`}
                style={{ height: '100%' }}
              />
              
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-sm group-hover:block">
                <p className="font-semibold">{getDayLabel(item.date)}</p>
                <p className="text-gray-400">{item.count} reviews</p>
                {item.count > 0 && (
                  <p className="text-yellow-400">Avg: {avgRating}★</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        {data.filter((_, i) => i % labelInterval === 0).map((item, index) => (
          <span key={index}>{getDayLabel(item.date)}</span>
        ))}
      </div>
    </div>
  )
}
