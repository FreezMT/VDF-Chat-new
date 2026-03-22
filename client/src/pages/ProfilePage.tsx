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
  const navigate = useNavigate()
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
    navigate('/', { replace: true })
  }

  function copyId() {
    if (!profile?.visibleId) return
    void navigator.clipboard.writeText(profile.visibleId)
  }

  if (!profile) {
    return (
      <p className="flex flex-1 items-center justify-center py-24 text-muted">Загрузка…</p>
    )
  }

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`
  const birthStr = profile.birthDate
    ? new Date(profile.birthDate).toLocaleDateString('ru-RU')
    : '—'
  const schoolName = profile.team?.name ?? 'Vinyl Dance Family'

  return (
    <div className="mx-auto flex w-full max-w-profile flex-1 flex-col pb-6 pt-2">
      <div className="flex flex-col items-center px-1">
        <Avatar className="h-28 w-28 border border-white/[0.08] shadow-lg ring-1 ring-white/5 sm:h-32 sm:w-32">
          <AvatarImage src={profile.avatarUrl ?? undefined} className="object-cover" />
          <AvatarFallback className="bg-[#2c2c2e] text-3xl font-semibold text-white/90">
            {initials}
          </AvatarFallback>
        </Avatar>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="mt-5 rounded-full bg-[#2c2c2e] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition active:scale-[0.98] active:bg-[#3a3a3c]"
            >
              Изменить фотографию
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

        <h1 className="mt-6 text-center text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="mt-2 text-center text-[13px] text-muted">
          {[profile.login ? `@${profile.login}` : null, profile.email].filter(Boolean).join(' · ') ||
            '—'}
        </p>
      </div>

      <div className="mt-10 w-full space-y-3">
        <button type="button" onClick={copyId} className="vdf-pill">
          ID: {profile.visibleId}
        </button>
        <div className="vdf-pill cursor-default">{schoolName}</div>
        <div className="vdf-pill cursor-default">{birthStr}</div>
        <div className="vdf-pill cursor-default text-muted">
          Роль: {roles[profile.role] ?? profile.role}
        </div>
      </div>

      {profile.role === 'admin' ? (
        <Link
          to="/admin"
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 font-medium transition-colors active:bg-white/[0.07]"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent/25 text-sm">⚙</span>
          Админ-панель
          <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted" />
        </Link>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        className="mt-10 h-14 w-full rounded-full text-[16px] font-semibold shadow-md"
        onClick={doLogout}
      >
        Выйти из аккаунта
      </Button>
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
          <Label className="text-[13px] text-muted">Ссылка на фото (URL)</Label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] text-muted">Имя</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] text-muted">Фамилия</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Button className="mt-2 w-full" size="lg" onClick={save} disabled={loading}>
          Сохранить
        </Button>
      </div>
    </>
  )
}
