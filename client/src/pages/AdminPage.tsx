import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listUsers, setUserRole, createTeam, assignTeam, deleteUser } from '@/api/admin'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import type { Role, UserPublic } from '@/types'

const roles: Role[] = ['dancer', 'parent', 'trainer', 'admin']

export function AdminPage() {
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<UserPublic[]>([])
  const [q, setQ] = useState('')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(true)

  async function reload() {
    const data = await listUsers(q ? { q } : undefined)
    setUsers(data)
  }

  useEffect(() => {
    if (me?.role !== 'admin') {
      navigate('/feed', { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await reload()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [me?.role, navigate])

  async function onSearch() {
    setLoading(true)
    try {
      await reload()
    } finally {
      setLoading(false)
    }
  }

  async function onRole(id: string, role: Role) {
    await setUserRole(id, role)
    await reload()
  }

  async function onCreateTeam() {
    if (!teamName.trim()) return
    await createTeam(teamName.trim())
    setTeamName('')
    await reload()
  }

  async function onAssign(userId: string, teamId: string) {
    await assignTeam(userId, teamId)
    await reload()
  }

  async function onDelete(id: string) {
    if (!confirm('Удалить пользователя?')) return
    await deleteUser(id)
    await reload()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Админ" />
      <div className="space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex gap-2">
          <Input placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="button" variant="secondary" onClick={() => void onSearch()}>
            Найти
          </Button>
        </div>
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium">Новая команда</p>
            <div className="flex gap-2">
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Название" />
              <Button type="button" onClick={() => void onCreateTeam()}>
                Создать
              </Button>
            </div>
          </CardContent>
        </Card>
        {loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="font-medium">
                  {u.firstName} {u.lastName}{' '}
                  <span className="text-muted-foreground">({u.visibleId})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={u.role === r ? 'default' : 'outline'}
                      onClick={() => void onRole(u.id, r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="team UUID"
                    className="font-mono text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void onAssign(u.id, (e.target as HTMLInputElement).value)
                      }
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={u.id === me?.id}
                  onClick={() => void onDelete(u.id)}
                >
                  Удалить
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
