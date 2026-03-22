import { useEffect, useState } from 'react'
import { http } from '@/api/http'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function PlusPage() {
  const me = useAuthStore((s) => s.user)
  const canGroup = me?.role === 'trainer' || me?.role === 'admin'
  const [idInput, setIdInput] = useState('')
  const [found, setFound] = useState<User | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [friends, setFriends] = useState<User[]>([])

  useEffect(() => {
    void http.get<{ friends: User[] }>('/api/users/friends').then((r) => setFriends(r.data.friends))
  }, [])

  async function find() {
    setErr(null)
    setFound(null)
    if (!/^\d{7}$/.test(idInput.trim())) {
      setErr('Введите 7 цифр')
      return
    }
    try {
      const { data } = await http.get<User>(`/api/users/${idInput.trim()}`)
      setFound(data)
    } catch {
      setErr('Пользователь не найден')
    }
  }

  async function addFriend(id: string) {
    await http.post(`/api/users/friend/${id}`)
    const { data } = await http.get<{ friends: User[] }>('/api/users/friends')
    setFriends(data.friends)
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <h1 className="mb-8 text-center text-[28px] font-bold tracking-tight sm:mb-10 sm:text-3xl">
        Добавить друга
      </h1>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="space-y-2">
          <Label htmlFor="friend-id" className="sr-only">
            ID друга
          </Label>
          <Input
            id="friend-id"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={7}
            value={idInput}
            onChange={(e) => setIdInput(e.target.value.replace(/\D/g, '').slice(0, 7))}
            placeholder="ID друга (7 цифр)"
            className="h-14 text-center text-lg tracking-widest placeholder:tracking-normal"
            onKeyDown={(e) => e.key === 'Enter' && find()}
          />
          <p className="px-1 text-center text-[13px] text-muted">
            Ваш ID можно посмотреть в профиле.
          </p>
        </div>

        {err ? (
          <p className="mt-4 text-center text-sm text-red-400/90">{err}</p>
        ) : null}

        <Button type="button" size="lg" variant="secondary" className="mt-8 w-full" onClick={find}>
          Найти
        </Button>

        {found ? (
          <div className="vdf-group mt-10">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <p className="text-[17px] font-semibold">
                  {found.firstName} {found.lastName}
                </p>
                <p className="text-sm text-muted">ID {found.visibleId}</p>
              </div>
              <Button size="sm" onClick={() => addFriend(found.id)}>
                В друзья
              </Button>
            </div>
          </div>
        ) : null}

        {canGroup ? (
          <div className="mt-auto pt-12">
            <CreateGroupDialog
              friends={friends}
              onCreated={() => {
                /* refresh chats on navigate */
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CreateGroupDialog({
  friends,
  onCreated,
}: {
  friends: User[]
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function submit() {
    if (!name.trim() || selected.size === 0) return
    setLoading(true)
    try {
      await http.post('/api/chats/group', {
        name: name.trim(),
        memberIds: [...selected],
      })
      setOpen(false)
      setName('')
      setSelected(new Set())
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-white/15">
          Создать группу
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-zinc-900 text-white">
        <DialogHeader>
          <DialogTitle>Новая группа</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="text-sm text-muted">Участники</p>
          <div className="vdf-group max-h-[45vh] overflow-y-auto">
            {friends.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.id)}
                className={`vdf-group-row ${selected.has(f.id) ? 'bg-accent/15' : ''}`}
              >
                <span className="font-medium">
                  {f.firstName} {f.lastName}
                </span>
                <span className="text-sm text-muted">{f.visibleId}</span>
              </button>
            ))}
          </div>
          <Button className="w-full" onClick={submit} disabled={loading}>
            Создать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
