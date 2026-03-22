import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { http } from '@/api/http'

export function AppShell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data } = await http.get<{ chats: { unreadCount: number }[] }>('/api/chats')
        if (cancelled) return
        const t = data.chats.reduce((s, c) => s + c.unreadCount, 0)
        setUnread(t)
      } catch {
        /* ignore */
      }
    }
    void load()
    const id = window.setInterval(load, 30_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-app text-white selection:bg-accent/30">
      <main className="relative flex min-h-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-app flex-1 flex-col px-4 sm:px-8 lg:px-12 xl:px-16">
          <Outlet />
        </div>
      </main>
      <BottomNav unread={unread} />
    </div>
  )
}
