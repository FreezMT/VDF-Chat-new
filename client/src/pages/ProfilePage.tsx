import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { http, bare } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ChevronRight } from 'lucide-react'

const roles: Record<string, string> = {
  dancer: 'Танцор',
  parent: 'Родитель',
  trainer: 'Тренер',
  admin: 'Админ',
}

export function ProfilePage() {
  const nav = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(user)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    void http.get<User>('/api/users/me').then((r) => {
      setProfile(r.data)
      setUser(r.data)
    })
  }, [setUser])

  async function doLogout() {
    try {
      await bare.post('/api/auth/logout')
    } catch {
      /* ignore */
    }
    logout()
    nav('/login', { replace: true })
  }

  function copyId() {
    if (!profile?.visibleId) return
    void navigator.clipboard.writeText(profile.visibleId)
  }

  if (!profile) {
    return (
      <p className="py-20 text-center text-muted">Загрузка…</p>
    )
  }

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col pb-4">
      <header className="mb-8 flex items-center justify-between sm:mb-10">
        <h1 className="text-[22px] font-bold tracking-tight sm:text-2xl">Профиль</h1>
      </header>

      <div className="flex flex-col items-center text-center">
        <Avatar className="h-28 w-28 border-2 border-white/10 shadow-xl sm:h-32 sm:w-32">
          <AvatarImage src={profile.avatarUrl ?? undefined} className="object-cover" />
          <AvatarFallback className="bg-zinc-800 text-3xl font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-[26px]">
          {profile.firstName} {profile.lastName}
        </h2>
        <button
          type="button"
          onClick={copyId}
          className="mt-2 text-[15px] text-accent hover:underline"
        >
          ID {profile.visibleId} · нажмите, чтобы скопировать
        </button>
        <p className="mt-1 text-sm text-muted">{profile.email}</p>
      </div>

      <div className="mx-auto mt-10 w-full max-w-xl space-y-3">
        <div className="vdf-group divide-y divide-white/[0.06]">
          <div className="px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Дата рождения</p>
            <p className="mt-1 text-[17px]">
              {profile.birthDate
                ? new Date(profile.birthDate).toLocaleDateString('ru-RU')
                : 'Не указана'}
            </p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Команда</p>
            <p className="mt-1 text-[17px]">{profile.team?.name ?? '—'}</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Роль</p>
            <p className="mt-1 text-[17px]">{roles[profile.role] ?? profile.role}</p>
          </div>
        </div>

        <div className="vdf-group">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="vdf-group-row font-medium"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-red-500/25 text-sm">
                  ✎
                </span>
                Редактировать профиль
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <EditProfileForm
                user={profile}
                onSaved={(u) => {
                  setProfile(u)
                  setUser(u)
                  setEditOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>

          {profile.role === 'admin' ? (
            <Link
              to="/admin"
              className="vdf-group-row border-t border-white/[0.06] font-medium"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/30 text-sm">
                ⚙
              </span>
              Админ-панель
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted" />
            </Link>
          ) : null}
        </div>

        <Button variant="destructive" className="mt-4 w-full" onClick={doLogout}>
          Выйти
        </Button>
      </div>
    </div>
  )
}

function EditProfileForm({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    try {
      const { data } = await http.put<User>('/api/users/me', {
        firstName,
        lastName,
        avatarUrl: avatarUrl || null,
      })
      onSaved(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Редактирование</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Имя</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Фамилия</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>URL аватара</Label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <Button className="w-full" onClick={save} disabled={loading}>
          Сохранить
        </Button>
      </div>
    </>
  )
}
