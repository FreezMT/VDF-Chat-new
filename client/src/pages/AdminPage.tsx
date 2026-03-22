import { useEffect, useState } from 'react'
import { http } from '@/api/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Role } from '@/types'

type Row = {
  id: string
  visibleId: string
  firstName: string
  lastName: string
  login: string | null
  email: string | null
  role: Role
  teamId: string | null
  team: { id: string; name: string } | null
}

export function AdminPage() {
  const [users, setUsers] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  async function load() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (roleFilter !== 'all') params.set('role', roleFilter)
    const { data } = await http.get<{ users: Row[] }>(`/api/admin/users?${params.toString()}`)
    setUsers(data.users)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function patchUserRole(id: string, role: Role) {
    await http.put(`/api/admin/users/${id}/role`, { role })
    void load()
  }

  async function remove(id: string) {
    if (!confirm('Удалить пользователя?')) return
    await http.delete(`/api/admin/users/${id}`)
    void load()
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-4 pt-2">
      <h1 className="text-[22px] font-bold tracking-tight sm:text-2xl">Админ-панель</h1>

      <div className="vdf-group p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label className="text-[13px] text-muted">Поиск</Label>
            <Input placeholder="Имя, логин, email, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-2 lg:w-48">
            <Label className="text-[13px] text-muted">Роль</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="dancer">Танцор</SelectItem>
                <SelectItem value="parent">Родитель</SelectItem>
                <SelectItem value="trainer">Тренер</SelectItem>
                <SelectItem value="admin">Админ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" className="lg:shrink-0" onClick={load}>
            Найти
          </Button>
        </div>
      </div>

      <div className="vdf-group divide-y divide-white/[0.06]">
        {users.map((u) => (
          <div key={u.id} className="px-4 py-4 sm:px-5">
            <p className="text-[17px] font-semibold">
              {u.firstName} {u.lastName}{' '}
              <span className="font-normal text-muted">({u.visibleId})</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {[u.login ? `@${u.login}` : null, u.email].filter(Boolean).join(' · ') || '—'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Роль: {u.role} · Команда: {u.team?.name ?? '—'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <MiniRole id={u.id} current={u.role} onPatch={patchUserRole} />
              <Button size="sm" variant="outline" onClick={() => remove(u.id)}>
                Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CreateTeamForm onCreated={load} />
    </div>
  )
}

function MiniRole({
  id,
  current,
  onPatch,
}: {
  id: string
  current: Role
  onPatch: (id: string, role: Role) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="text-xs text-muted">Роль</Label>
      <Select value={current} onValueChange={(v) => onPatch(id, v as Role)}>
        <SelectTrigger className="h-10 w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dancer">dancer</SelectItem>
          <SelectItem value="parent">parent</SelectItem>
          <SelectItem value="trainer">trainer</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function CreateTeamForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await http.post('/api/admin/teams', { name: name.trim() })
      setName('')
      onCreated()
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="vdf-group p-4 sm:p-5">
      <p className="mb-3 text-[17px] font-semibold">Новая команда</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название команды"
        />
        <Button type="button" onClick={submit} disabled={loading}>
          Создать
        </Button>
      </div>
    </div>
  )
}
