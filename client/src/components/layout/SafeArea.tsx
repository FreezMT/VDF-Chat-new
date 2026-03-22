import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SafeArea({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'min-h-[100dvh] flex flex-col bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {children}
    </div>
  )
}
