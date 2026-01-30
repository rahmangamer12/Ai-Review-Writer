'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QuickPostManager } from '@/lib/integrations/browserAutomation'

interface QuickPostButtonProps {
  platform: 'yelp' | 'tripadvisor' | 'trustpilot'
  reviewId: string
  replyText: string
  platformConfig: any
}

export default function QuickPostButton({
  platform,
  reviewId,
  replyText,
  platformConfig
}: QuickPostButtonProps) {
  const [loading, setLoading] = useState(false)
  const [posted, setPosted] = useState(false)

  const handleQuickPost = async () => {
    setLoading(true)
    try {
      const result = await QuickPostManager.prepareQuickPost(
        platform,
        reviewId,
        replyText,
        platformConfig
      )

      if (result.success) {
        setPosted(true)
        alert(result.message)
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error('Quick post error:', error)
      alert('Failed to open quick post window')
    } finally {
      setLoading(false)
    }
  }

  const platformLabels = {
    yelp: 'Post to Yelp',
    tripadvisor: 'Post to TripAdvisor',
    trustpilot: 'Post to Trustpilot'
  }

  const platformIcons = {
    yelp: '⭐',
    tripadvisor: '✈️',
    trustpilot: '💚'
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleQuickPost}
      disabled={loading || posted}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        posted
          ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
    >
      <span>{platformIcons[platform]}</span>
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Opening...
        </span>
      ) : posted ? (
        <span>✓ Window Opened</span>
      ) : (
        <span>{platformLabels[platform]}</span>
      )}
    </motion.button>
  )
}
