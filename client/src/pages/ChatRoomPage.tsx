import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { http } from '@/api/http'
import type { Message } from '@/types'
import { connectSocket, getSocket } from '@/services/socket'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const me = useAuthStore((s) => s.user)
  const [title, setTitle] = useState('Чат')
  const [messages, setMessages] = useState<Message[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const typingTimer = useRef<number | null>(null)
  const meId = me?.id

  useEffect(() => {
    if (!chatId) return
    let cancelled = false
    async function load() {
      const { data } = await http.get<{ messages: Message[]; nextCursor: string | null }>(
        `/api/chats/${chatId}/messages?limit=40`,
      )
      if (cancelled) return
      setMessages(data.messages)
      setNextCursor(data.nextCursor)
      await http.post(`/api/chats/${chatId}/read`)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [chatId])

  useEffect(() => {
    if (!chatId) return
    const s = connectSocket()
    if (!s) return
    s.emit('chat:join', { chatId })
    function onNew(payload: { message: Message }) {
      if (payload.message.chatId !== chatId) return
      setMessages((m) => [...m, payload.message])
      void http.post(`/api/chats/${chatId}/read`)
    }
    function onTyping(payload: { chatId: string; firstName: string }) {
      if (payload.chatId !== chatId) return
      setTyping(payload.firstName)
      if (typingTimer.current) window.clearTimeout(typingTimer.current)
      typingTimer.current = window.setTimeout(() => setTyping(null), 2000)
    }
    s.on('message:new', onNew)
    s.on('message:typing', onTyping)
    return () => {
      s.off('message:new', onNew)
      s.off('message:typing', onTyping)
    }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!chatId || !meId) return
    void http
      .get<{
        chats: {
          id: string
          name: string | null
          members: { id: string; firstName: string; lastName: string }[]
        }[]
      }>('/api/chats')
      .then((r) => {
        const c = r.data.chats.find((x) => x.id === chatId)
        if (!c) return
        if (c.name) setTitle(c.name)
        else {
          const other = c.members.find((m) => m.id !== meId)
          if (other) setTitle(`${other.firstName} ${other.lastName}`)
        }
      })
  }, [chatId, meId])

  const sorted = useMemo(() => messages, [messages])

  async function loadOlder() {
    if (!chatId || !nextCursor) return
    const { data } = await http.get<{ messages: Message[]; nextCursor: string | null }>(
      `/api/chats/${chatId}/messages?limit=40&cursor=${nextCursor}`,
    )
    setMessages((prev) => [...data.messages, ...prev])
    setNextCursor(data.nextCursor)
  }

  function send() {
    const t = text.trim()
    if (!t || !chatId) return
    const s = getSocket()
    s?.emit('message:send', { chatId, content: t })
    setText('')
  }

  function emitTyping() {
    const s = getSocket()
    s?.emit('message:typing', { chatId })
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col lg:min-h-[calc(100dvh-7rem)]">
      <header className="sticky top-0 z-10 -mx-4 mb-2 flex items-center gap-3 border-b border-white/[0.08] bg-app/90 px-2 py-3 backdrop-blur-md sm:-mx-8 sm:px-3 lg:-mx-12 xl:-mx-16">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full" asChild>
          <Link to="/chats" aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold sm:text-lg">{title}</h1>
          {typing ? <p className="text-[13px] text-muted">{typing} печатает…</p> : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pb-28 pt-2 sm:pb-32">
        {nextCursor ? (
          <Button variant="ghost" className="mx-auto text-xs text-muted" onClick={loadOlder}>
            Ранние сообщения
          </Button>
        ) : null}
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-1">
          {sorted.map((m) => {
            const mine = m.senderId === meId
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[min(85%,42rem)] rounded-[1.15rem] px-3.5 py-2.5 text-[15px] leading-snug shadow-sm',
                    mine
                      ? 'bg-accent text-white'
                      : 'bg-zinc-800/95 text-white',
                  )}
                >
                  {!mine ? (
                    <p className="mb-1 text-[12px] text-white/55">
                      {m.sender.firstName} {m.sender.lastName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.mediaUrl ? (
                    m.mediaType === 'video' ? (
                      <video
                        src={m.mediaUrl}
                        controls
                        className="mt-2 max-h-72 w-full rounded-xl"
                      />
                    ) : (
                      <img
                        src={m.mediaUrl}
                        alt=""
                        className="mt-2 max-h-72 w-full rounded-xl object-cover"
                      />
                    )
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 border-t border-white/[0.08] bg-app/92 px-4 py-3 backdrop-blur-lg sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto flex max-w-app gap-2">
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              emitTyping()
            }}
            placeholder="Сообщение…"
            className="flex-1 border-white/[0.12]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <Button onClick={send} className="shrink-0 px-5">
            Отпр.
          </Button>
        </div>
      </div>
    </div>
  )
}
