import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const { data } = await http.post<{ user: User; accessToken: string }>('/api/auth/login', {
        email,
        password,
      })
      setAuth(data.accessToken, data.user)
      nav('/feed', { replace: true })
    } catch {
      setErr('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">VDF Chat</h1>
          <p className="mt-2 text-[15px] text-muted">Вход в аккаунт</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] text-muted">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] text-muted">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err ? <p className="text-center text-sm text-red-400/90">{err}</p> : null}
          <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
            {loading ? '…' : 'Войти'}
          </Button>
          <p className="pt-4 text-center text-[15px] text-muted">
            Нет аккаунта?{' '}
            <Link className="font-medium text-accent hover:underline" to="/register">
              Регистрация
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
