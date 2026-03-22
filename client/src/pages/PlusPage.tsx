import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { findByVisibleId, addFriend, listFriends } from '@/api/users'
import { getOrCreatePrivate, createGroup } from '@/api/chats'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import type { UserPublic } from '@/types'

export function PlusPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [visibleId, setVisibleId] = useState('')
  const [found, setFound] = useState<UserPublic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [friends, setFriends] = useState<UserPublic[]>([])
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const canGroup = user?.role === 'trainer' || user?.role === 'admin'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const f = await listFriends()
        if (!cancelled) setFriends(f)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSearch() {
    setError(null)
    setFound(null)
    if (!/^\d{7}$/.test(visibleId.trim())) {
      setError('Введите 7 цифр')
      return
    }
    try {
      const u = await findByVisibleId(visibleId.trim())
      setFound(u)
    } catch {
      setError('Пользователь не найден')
    }
  }

  async function onAddFriend() {
    if (!found) return
    await addFriend(found.id)
  }

  async function onOpenChat() {
    if (!found) return
    const chat = await getOrCreatePrivate(found.id)
    navigate(`/chats/${chat.id}`, { state: { name: chat.name } })
  }

  async function onCreateGroup() {
    if (!groupName.trim() || selected.size === 0) return
    const chat = await createGroup(groupName.trim(), Array.from(selected))
    setGroupOpen(false)
    setGroupName('')
    setSelected(new Set())
    navigate(`/chats/${chat.id}`, { state: { name: chat.name } })
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Плюс"
        right={
          canGroup ? (
            <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  Группа
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать группу</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                  </div>
                  <p className="text-sm text-muted-foreground">Участники</p>
                  <div className="space-y-2">
                    {friends.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggle(f.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left ${
                          selected.has(f.id) ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <Avatar className="h-9 w-9">
                          {f.avatarUrl && <AvatarImage src={f.avatarUrl} alt="" />}
                          <AvatarFallback>{f.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {f.firstName} {f.lastName}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => void onCreateGroup()}>
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <div className="space-y-4 px-4 py-4">
        <div className="flex gap-2">
          <Input
            placeholder="ID друга (7 цифр)"
            inputMode="numeric"
            value={visibleId}
            onChange={(e) => setVisibleId(e.target.value.replace(/\D/g, '').slice(0, 7))}
          />
          <Button type="button" onClick={() => void onSearch()}>
            Найти
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {found && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-12 w-12">
                  {found.avatarUrl && <AvatarImage src={found.avatarUrl} alt="" />}
                  <AvatarFallback>
                    {found.firstName[0]}
                    {found.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {found.firstName} {found.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">ID {found.visibleId}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void onAddFriend()}>
                    В друзья
                  </Button>
                  <Button size="sm" onClick={() => void onOpenChat()}>
                    Написать
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
