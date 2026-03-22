import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import { fetchMessages, markRead } from '@/api/chats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { getSocket } from '@/services/socket'
import type { Message } from '@/types'

export function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateName = (location.state as { name?: string } | null)?.name
  const user = useAuthStore((s) => s.user)
  const messagesByChat = useChatStore((s) => s.messagesByChat)
  const prependMessages = useChatStore((s) => s.prependMessages)
  const typing = useChatStore((s) => (chatId ? s.typingByChat[chatId] : null))
  const [text, setText] = useState('')
  const [title, setTitle] = useState(stateName ?? 'Чат')
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const topSentinel = useRef<HTMLDivElement | null>(null)

  const messages = chatId ? messagesByChat[chatId] ?? [] : []

  const loadOlder = useCallback(async () => {
    if (!chatId || !nextCursor) return
    const data = await fetchMessages(chatId, nextCursor)
    prependMessages(chatId, data.messages)
    setNextCursor(data.nextCursor)
  }, [chatId, nextCursor, prependMessages])

  useEffect(() => {
    if (!chatId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchMessages(chatId)
        if (cancelled) return
        useChatStore.setState((s) => ({
          messagesByChat: { ...s.messagesByChat, [chatId]: data.messages },
        }))
        setNextCursor(data.nextCursor)
        await markRead(chatId)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId])

  useEffect(() => {
    if (stateName) setTitle(stateName)
  }, [stateName])

  useEffect(() => {
    if (!chatId) return
    const socket = getSocket()
    socket?.emit('chat:join', { chatId })
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, chatId])

  useEffect(() => {
    const el = topSentinel.current
    if (!el || !chatId) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadOlder()
      },
      { rootMargin: '100px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [chatId, loadOlder])

  function send() {
    if (!chatId || !text.trim()) return
    const socket = getSocket()
    socket?.emit('message:send', { chatId, content: text.trim() })
    setText('')
  }

  function onTyping() {
    if (!chatId) return
    const socket = getSocket()
    socket?.emit('message:typing', { chatId })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          {typing && typing.userId !== user?.id && (
            <p className="text-xs text-muted-foreground">{typing.firstName} печатает…</p>
          )}
        </div>
      </header>
      <ScrollArea className="flex-1 px-3">
        <div ref={topSentinel} className="h-2" />
        {loading && <p className="py-4 text-center text-sm text-muted-foreground">Загрузка…</p>}
        <div className="space-y-2 py-3">
          {messages.map((m: Message) => {
            const mine = m.senderId === user?.id
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {!mine && (
                    <p className="mb-1 text-xs opacity-80">
                      {m.sender?.firstName} {m.sender?.lastName}
                    </p>
                  )}
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                  {m.mediaUrl && m.mediaType === 'image' && (
                    <img src={m.mediaUrl} alt="" className="mt-2 max-h-60 rounded-lg" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="flex gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Input
          placeholder="Сообщение"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
        />
        <Button size="icon" onClick={send} aria-label="Отправить">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
