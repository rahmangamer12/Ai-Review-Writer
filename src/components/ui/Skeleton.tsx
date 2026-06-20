'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-white/5 rounded',
        variant === 'text' && 'h-4 rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0c0c18] p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton />
        <Skeleton width="80%" />
        <Skeleton width="90%" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-2 border-b border-white/5">
        <Skeleton width={100} />
        <Skeleton width={150} />
        <Skeleton width={80} />
        <Skeleton width={120} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-white/5">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton width={120} />
          <Skeleton width={80} />
          <Skeleton width={60} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-[#0c0c18] p-6 space-y-3">
          <Skeleton width={80} />
          <Skeleton width={60} height={32} />
          <Skeleton width={100} />
        </div>
      ))}
    </div>
  )
}
