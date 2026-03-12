'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/10'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={16} className="mb-2" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" width="100%" className="mb-2" />
      <Skeleton variant="text" width="80%" className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={60} height={28} />
        <Skeleton variant="rounded" width={60} height={28} />
      </div>
    </div>
  )
}

export function SkeletonStats({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="rounded" width={40} height={16} />
          </div>
          <Skeleton variant="text" width="50%" height={32} className="mb-2" />
          <Skeleton variant="text" width="70%" height={14} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <Skeleton variant="text" width={200} height={24} />
      </div>
      <div className="divide-y divide-white/5">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1">
              <Skeleton variant="text" width="60%" height={16} className="mb-2" />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
            <Skeleton variant="rounded" width={80} height={28} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width={150} height={24} />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rounded" width={60} height={32} />
          ))}
        </div>
      </div>
      <div className="h-64 flex items-end gap-2">
        {[...Array(12)].map((_, i) => (
          <Skeleton 
            key={i} 
            variant="rounded" 
            className="flex-1" 
            height={`${Math.random() * 60 + 20}%`} 
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonList({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(items)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-start gap-4">
            <Skeleton variant="circular" width={44} height={44} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Skeleton variant="text" width={120} height={16} />
                <Skeleton variant="text" width={60} height={12} />
              </div>
              <Skeleton variant="text" width="100%" height={14} className="mb-2" />
              <Skeleton variant="text" width="70%" height={14} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <Skeleton variant="text" width={300} height={40} className="mb-2" />
          <Skeleton variant="text" width={200} height={20} />
        </div>
        <SkeletonStats className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart className="lg:col-span-2" />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}
