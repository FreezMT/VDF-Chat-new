import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Newspaper, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chatStore'

const tabs = [
  { to: '/feed', icon: Newspaper, label: 'Лента' },
  { to: '/plus', icon: PlusCircle, label: 'Плюс' },
  { to: '/chats', icon: MessageCircle, label: 'Чаты' },
  { to: '/profile', icon: User, label: 'Профиль' },
] as const

export function BottomNav() {
  const location = useLocation()
  const totalUnread = useChatStore((s) => s.totalUnread)

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex h-16 max-w-lg mx-auto items-center justify-around border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to !== '/feed' && location.pathname.startsWith(to))
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="relative">
              <Icon className="h-6 w-6" />
              {to === '/chats' && totalUnread > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
