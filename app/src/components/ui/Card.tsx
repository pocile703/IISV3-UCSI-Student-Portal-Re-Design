import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-[--ucsi-border] shadow-sm', className)} style={{ backgroundColor: 'var(--bg-surface)' }}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('flex flex-col gap-1 px-5 pt-5 pb-3', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div className={cn('flex items-center px-5 pb-5 pt-0', className)}>
      {children}
    </div>
  )
}
