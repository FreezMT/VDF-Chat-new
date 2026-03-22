import { cn } from '@/lib/utils'

export function TopBar({
  title,
  right,
  className,
}: {
  title: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-border px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className,
      )}
    >
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {right}
    </header>
  )
}
