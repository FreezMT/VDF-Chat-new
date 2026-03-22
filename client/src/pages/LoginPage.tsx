import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import { AuthBackBar } from '@/components/auth/AuthBackBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [invalidLogin, setInvalidLogin] = useState(false)
  const [invalidPassword, setInvalidPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function clearErrors() {
    setErr(null)
    setInvalidLogin(false)
    setInvalidPassword(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearErrors()
    const loginTrim = login.trim()
    if (!loginTrim) {
      setErr('Введите логин')
      setInvalidLogin(true)
      return
    }
    if (!password) {
      setErr('Введите пароль')
      setInvalidPassword(true)
      return
    }
    setLoading(true)
    try {
      const { data } = await http.post<{ user: User; accessToken: string }>('/api/auth/login', {
        login: loginTrim,
        password,
      })
      setAuth(data.accessToken, data.user)
      nav('/feed', { replace: true })
    } catch {
      setErr('Неверный логин или пароль')
      setInvalidLogin(true)
      setInvalidPassword(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-app">
      <header className="shrink-0 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <AuthBackBar />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-white sm:text-[32px]">VDF Chat</h1>
          <p className="mt-2 text-[15px] text-muted">Вход в аккаунт</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <form noValidate onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="login"
                className={cn('text-[13px]', invalidLogin ? 'text-red-400/95' : 'text-muted')}
              >
                Логин
              </Label>
              <Input
                id="login"
                autoComplete="username"
                value={login}
                invalid={invalidLogin}
                onChange={(e) => {
                  setLogin(e.target.value)
                  if (err) clearErrors()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={cn('text-[13px]', invalidPassword ? 'text-red-400/95' : 'text-muted')}
              >
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                invalid={invalidPassword}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (err) clearErrors()
                }}
              />
            </div>
            {err ? (
              <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-center text-[13px] leading-snug text-red-300">
                {err}
              </p>
            ) : null}
            <Button type="submit" className="w-full shadow-md" size="lg" disabled={loading}>
              {loading ? '…' : 'Войти'}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-[15px] text-muted">
          Нет аккаунта?{' '}
          <Link className="font-semibold text-accent hover:underline" to="/register">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  )
}
