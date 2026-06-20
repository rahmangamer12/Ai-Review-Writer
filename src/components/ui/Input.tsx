'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({
  className,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/70"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white/5 px-4 py-2.5',
            'text-white placeholder:text-white/30',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error
              ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
              : 'border-white/10 hover:border-white/20',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-sm text-white/40">
          {hint}
        </p>
      )}
    </div>
  )
}
