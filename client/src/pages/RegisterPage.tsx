import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterPage() {
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [role, setRole] = useState<'dancer' | 'parent'>('dancer')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const { data } = await http.post<{ user: User; accessToken: string }>('/api/auth/register', {
        firstName,
        lastName,
        email,
        password,
        role,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
      })
      setAuth(data.accessToken, data.user)
      nav('/feed', { replace: true })
    } catch {
      setErr('Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-black px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-md pb-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Регистрация</h1>
          <p className="mt-2 text-[15px] text-muted">Vinyl Dance Family</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fn" className="text-[13px] text-muted">
                Имя
              </Label>
              <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln" className="text-[13px] text-muted">
                Фамилия
              </Label>
              <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] text-muted">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] text-muted">
              Пароль (мин. 8 символов)
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bd" className="text-[13px] text-muted">
              Дата рождения
            </Label>
            <Input
              id="bd"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] text-muted">Роль</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={role === 'dancer' ? 'default' : 'secondary'}
                onClick={() => setRole('dancer')}
              >
                Танцор
              </Button>
              <Button
                type="button"
                variant={role === 'parent' ? 'default' : 'secondary'}
                onClick={() => setRole('parent')}
              >
                Родитель
              </Button>
            </div>
          </div>
          {err ? <p className="text-center text-sm text-red-400/90">{err}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? '…' : 'Создать аккаунт'}
          </Button>
          <p className="pt-2 text-center text-[15px] text-muted">
            Уже есть аккаунт?{' '}
            <Link className="font-medium text-accent hover:underline" to="/login">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
