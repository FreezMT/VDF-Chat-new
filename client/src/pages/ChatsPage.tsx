import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { http } from '@/api/http'
import type { ChatListItem } from '@/types'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ChatsPage() {
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    void http.get<{ chats: ChatListItem[] }>('/api/chats').then((r) => setChats(r.data.chats))
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return chats
    return chats.filter((c) => (c.name ?? '').toLowerCase().includes(s))
  }, [chats, q])

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="mb-4 flex flex-col gap-1 sm:mb-6">
        <h1 className="text-[22px] font-bold tracking-tight sm:text-2xl">Чаты</h1>
      </header>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <Input
          placeholder="Поиск"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 border-white/[0.1] bg-white/[0.07] pl-12"
        />
      </div>

      <div className="vdf-group flex-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Нет чатов</p>
        ) : (
          filtered.map((c, i) => {
            const title = c.name ?? 'Чат'
            const last = c.lastMessage
            const initials = title.slice(0, 2).toUpperCase()
            return (
              <Link
                key={c.id}
                to={`/chats/${c.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]',
                  i > 0 && 'border-t border-white/[0.06]',
                )}
              >
                <Avatar className="h-14 w-14 shrink-0 border border-white/5">
                  <AvatarImage src={c.avatarUrl ?? undefined} className="object-cover" />
                  <AvatarFallback className="bg-zinc-800 text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[17px] font-semibold leading-tight">{title}</p>
                    {last ? (
                      <span className="shrink-0 text-[13px] tabular-nums text-muted">
                        {new Date(last.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[15px] text-muted">
                    {last ? last.content || 'Медиа' : 'Нет сообщений'}
                  </p>
                </div>
                {c.unreadCount > 0 ? (
                  <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-zinc-600 px-2 text-[13px] font-semibold">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                ) : null}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
