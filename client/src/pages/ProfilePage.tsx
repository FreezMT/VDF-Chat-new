import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { logout } from '@/api/auth'
import { updateMe } from '@/api/users'
import { uploadFile } from '@/api/upload'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { subscribePush } from '@/services/push'

const roleLabels: Record<string, string> = {
  dancer: 'Танцор',
  parent: 'Родитель',
  trainer: 'Тренер',
  admin: 'Админ',
}

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logoutStore = useAuthStore((s) => s.logout)
  const [editOpen, setEditOpen] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')

  async function onSave() {
    if (!user) return
    const u = await updateMe({ firstName, lastName })
    setUser(u)
    setEditOpen(false)
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200 })
    const { url } = await uploadFile(compressed)
    const u = await updateMe({ avatarUrl: url })
    setUser(u)
  }

  async function onLogout() {
    await logout()
    logoutStore()
    navigate('/login', { replace: true })
  }

  async function onEnablePush() {
    await subscribePush()
  }

  if (!user) return null

  const initials = `${user.firstName[0]}${user.lastName[0]}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Профиль" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-col items-center gap-3">
          <label className="relative cursor-pointer">
            <Avatar className="h-24 w-24">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onAvatar(e)} />
          </label>
          <p className="text-lg font-semibold">
            {user.firstName} {user.lastName}
          </p>
          <button
            type="button"
            className="text-sm text-primary"
            onClick={async () => {
              await navigator.clipboard.writeText(user.visibleId)
            }}
          >
            ID: {user.visibleId} (копировать)
          </button>
        </div>
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <Row label="Роль" value={roleLabels[user.role] ?? user.role} />
            <Row
              label="Дата рождения"
              value={user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'}
            />
            <Row label="Команда" value={user.team?.name ?? '—'} />
          </CardContent>
        </Card>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full">
              Редактировать
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирование</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Фамилия</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => void onSave()}>
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" className="w-full" onClick={() => void onEnablePush()}>
          Включить уведомления
        </Button>
        {user.role === 'admin' && (
          <Button className="w-full" variant="secondary" onClick={() => navigate('/admin')}>
            Админ-панель
          </Button>
        )}
        <Button variant="destructive" className="w-full" onClick={() => void onLogout()}>
          Выйти
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
