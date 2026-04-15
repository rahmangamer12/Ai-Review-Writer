import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Minus, Globe, Facebook, Star, MapPin, CheckCircle, Instagram, MessageSquare } from 'lucide-react'

// Platform icon mapping
export const PlatformIcon = ({ platform, className = "h-4 w-4" }: { platform: string, className?: string }) => {
  switch (platform) {
    case 'google': return <Globe className={className} />
    case 'facebook': return <Facebook className={className} />
    case 'yelp': return <Star className={className} />
    case 'tripadvisor': return <MapPin className={className} />
    case 'trustpilot': return <CheckCircle className={className} />
    case 'instagram': return <Instagram className={className} />
    default: return <MessageSquare className={className} />
  }
}

export const ModernLineChart = ({ data, color = 'purple' }: { data: { date: string; value: number }[], color?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="relative h-48 sm:h-64 w-full min-w-0">
      <div className="absolute inset-0 flex flex-col justify-between">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-px w-full bg-white/5" />
        ))}
      </div>

      <div className="absolute inset-0 flex items-end justify-between gap-0.5 sm:gap-1 min-w-0 overflow-x-auto">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div key={index} className="group relative flex-1 min-w-0">
              <div className="absolute -top-12 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-gray-900 px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                <p className="font-medium">{item.date}</p>
                <p className="text-gray-400">{item.value} reviews</p>
              </div>

              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                className={`mx-auto w-full rounded-t-lg bg-gradient-to-t from-${color}-500/50 to-${color}-400 transition-all hover:from-${color}-400 hover:to-${color}-300`}
                style={{ minHeight: item.value > 0 ? 4 : 0 }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const PlatformDistributionCard = ({ data }: { data: Record<string, number> }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])

  const platformColors: Record<string, string> = {
    google: 'bg-blue-500', facebook: 'bg-indigo-500', yelp: 'bg-red-500',
    tripadvisor: 'bg-emerald-500', trustpilot: 'bg-green-500', instagram: 'bg-pink-500',
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {sorted.map(([platform, count], index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={platform} className="group">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={platform} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <span className="text-sm sm:text-base font-medium capitalize text-white">{platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">{count}</span>
                <span className="text-xs sm:text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full rounded-full ${platformColors[platform] || 'bg-gray-500'}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const SentimentCard = ({ data }: { data: { positive: number, negative: number, neutral: number } }) => {
  const total = data.positive + data.negative + data.neutral

  const sentiments = [
    { label: 'Positive', value: data.positive, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: ThumbsUp },
    { label: 'Neutral', value: data.neutral, color: 'bg-amber-500', textColor: 'text-amber-400', icon: Minus },
    { label: 'Negative', value: data.negative, color: 'bg-rose-500', textColor: 'text-rose-400', icon: ThumbsDown },
  ]

  return (
    <div className="space-y-3 sm:space-y-4">
      {sentiments.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0
        return (
          <div key={item.label}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <item.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.textColor}`} />
                <span className="text-sm sm:text-base text-gray-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">{item.value}</span>
                <span className="text-xs sm:text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full rounded-full ${item.color}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const RatingDistributionCard = ({ data }: { data: number[] }) => {
  const total = data.reduce((a, b) => a + b, 0)
  
  return (
    <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
      {[5, 4, 3, 2, 1].map((rating, index) => {
        const count = data[rating - 1] || 0
        const percentage = total > 0 ? (count / total) * 100 : 0
        
        return (
          <div key={rating} className="flex items-center gap-3 sm:gap-4">
            <div className="flex w-12 sm:w-16 items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-400">
              <span>{rating}</span>
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="flex-1 h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-full rounded-full bg-yellow-400"
              />
            </div>
            <div className="w-8 sm:w-12 text-right text-xs sm:text-sm font-medium text-white">{count}</div>
          </div>
        )
      })}
    </div>
  )
}
