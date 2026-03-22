import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-full bg-accent text-white hover:bg-violet-600 active:bg-violet-700',
        secondary:
          'rounded-full bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600',
        ghost: 'rounded-full text-white hover:bg-white/10',
        outline: 'rounded-full border border-white/15 bg-transparent hover:bg-white/[0.06]',
        destructive: 'rounded-full bg-red-600/90 text-white hover:bg-red-600',
      },
      size: {
        default: 'h-12 px-6 py-2',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-14 min-w-[200px] px-8 text-base',
        icon: 'h-11 w-11 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
