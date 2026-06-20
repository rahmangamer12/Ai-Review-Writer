'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-md',
        secondary: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 focus-visible:ring-indigo-500',
        outline: 'border border-white/20 text-white hover:bg-white/5 focus-visible:ring-indigo-500',
        ghost: 'text-white/70 hover:text-white hover:bg-white/5 focus-visible:ring-indigo-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
        gradient: 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-violet-500/20',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
        default: 'h-10 px-4 text-sm rounded-xl gap-2',
        lg: 'h-12 px-6 text-base rounded-xl gap-2',
        xl: 'h-14 px-8 text-lg rounded-2xl gap-2.5',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  className,
  variant,
  size,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  )
}

export { buttonVariants }
