import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** Куда перейти по «Назад» (по умолчанию — главный экран) */
  to?: string
  /** Если задано, вызывается вместо перехода по `to` */
  onBack?: () => void
  className?: string
}

export function AuthBackBar({ to = '/', onBack, className }: Props) {
  const nav = useNavigate()
  return (
    <div className={cn('flex items-center px-1', className)}>
      <button
        type="button"
        onClick={() => (onBack ? onBack() : nav(to))}
        className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition-colors active:bg-white/[0.08]"
        aria-label="Назад"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
      </button>
    </div>
  )
}
