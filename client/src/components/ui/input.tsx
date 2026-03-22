import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Красная обводка и фон при ошибке валидации */
  invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => {
    return (
      <input
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-12 w-full rounded-2xl border bg-white/[0.06] px-4 py-2 text-[15px] text-white placeholder:text-muted transition-[border-color,box-shadow] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          invalid
            ? 'border-red-500/55 bg-red-500/[0.09] focus-visible:ring-2 focus-visible:ring-red-500/45'
            : 'border-white/[0.12] focus-visible:ring-2 focus-visible:ring-accent/60',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
