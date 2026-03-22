import { NavLink } from 'react-router-dom'
import { MessageCircle, Newspaper, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/feed', label: 'Лента', icon: Newspaper },
  { to: '/plus', label: 'Плюс', icon: PlusCircle },
  { to: '/chats', label: 'Чаты', icon: MessageCircle, badge: true },
  { to: '/profile', label: 'Профиль', icon: User },
]

export function BottomNav({ unread }: { unread: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div
        className="pointer-events-none border-t border-white/[0.06] bg-[#121212]/92 backdrop-blur-[24px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="pointer-events-none flex justify-center pb-2 pt-2">
          <nav
            className="pointer-events-auto flex w-[calc(100%-2rem)] max-w-xl items-stretch gap-0.5 rounded-full border border-white/[0.08] bg-[#1c1c1e]/95 px-2 py-2 shadow-nav backdrop-blur-xl sm:max-w-2xl md:gap-1 md:px-3"
            aria-label="Основное меню"
          >
            {items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-2 text-[11px] font-medium transition-colors sm:text-xs',
                    isActive ? 'text-white' : 'text-muted hover:text-white/90',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'relative flex h-9 w-12 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-14',
                        isActive ? 'bg-white/12' : '',
                      )}
                    >
                      <Icon className="h-[22px] w-[22px] sm:h-6 sm:w-6" strokeWidth={1.75} />
                      {badge && unread > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-zinc-600 px-1 text-[10px] font-semibold leading-none text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
