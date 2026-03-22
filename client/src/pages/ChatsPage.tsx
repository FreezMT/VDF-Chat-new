import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { listChats } from '@/api/chats'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChatStore } from '@/stores/chatStore'
import type { ChatListItem } from '@/types'

function ChatRow({ chat }: { chat: ChatListItem }) {
  const preview = chat.lastMessage?.content || (chat.lastMessage?.mediaUrl ? 'Медиа' : 'Нет сообщений')
  const time = chat.lastMessage?.createdAt
    ? new Date(chat.lastMessage.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : ''
  const initials = chat.name?.slice(0, 2) ?? '?'
  return (
    <Link
      to={`/chats/${chat.id}`}
      state={{ name: chat.name }}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
    >
      <Avatar className="h-12 w-12">
        {chat.avatarUrl && <AvatarImage src={chat.avatarUrl} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{chat.name}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{preview}</p>
      </div>
      {chat.unreadCount > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
        </span>
      )}
    </Link>
  )
}

export function ChatsPage() {
  const setChats = useChatStore((s) => s.setChats)
  const chats = useChatStore((s) => s.chats)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await listChats()
        if (!cancelled) setChats(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setChats])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return chats
    return chats.filter((c) => c.name?.toLowerCase().includes(s))
  }, [chats, q])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Чаты" />
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {loading && <p className="text-center text-sm text-muted-foreground">Загрузка…</p>}
        {filtered.map((c) => (
          <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ChatRow chat={c} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
