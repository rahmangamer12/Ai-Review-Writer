'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-6 max-w-md mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} leftIcon={action.icon && <action.icon className="w-4 h-4" />}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
