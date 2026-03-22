import { cn } from '@/lib/utils'

export function SafeArea({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'min-h-dvh w-full max-w-lg mx-auto flex flex-col',
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
