import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { http, bare } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import { AuthBackBar } from '@/components/auth/AuthBackBar'
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
import { cn } from '@/lib/utils'

type TeamOpt = { value: string; label: string }

type S1Err = { login?: boolean; password?: boolean }
type S2Err = { firstName?: boolean; lastName?: boolean; birthDate?: boolean; team?: boolean }

export function RegisterPage() {
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState<1 | 2>(1)

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'dancer' | 'parent'>('dancer')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [teamValue, setTeamValue] = useState('')

  const [teams, setTeams] = useState<TeamOpt[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [teamsError, setTeamsError] = useState<string | null>(null)

  const [err, setErr] = useState<string | null>(null)
  const [s1Err, setS1Err] = useState<S1Err>({})
  const [s2Err, setS2Err] = useState<S2Err>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void bare
      .get<{ teams: TeamOpt[] }>('/api/teams')
      .then((r) => {
        setTeams(r.data.teams)
        setTeamsError(null)
      })
      .catch(() => setTeamsError('Не удалось загрузить список команд'))
      .finally(() => setTeamsLoading(false))
  }, [])

  function clearFormErr() {
    setErr(null)
    setS1Err({})
    setS2Err({})
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setS1Err({})
    const l = login.trim()
    if (!l) {
      setErr('Введите логин')
      setS1Err({ login: true })
      return
    }
    if (l.length < 3) {
      setErr('Логин — не меньше 3 символов')
      setS1Err({ login: true })
      return
    }
    if (!password) {
      setErr('Введите пароль')
      setS1Err({ password: true })
      return
    }
    if (password.length < 8) {
      setErr('Пароль — не меньше 8 символов')
      setS1Err({ password: true })
      return
    }
    setStep(2)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setS2Err({})

    if (!firstName.trim()) {
      setErr('Введите имя')
      setS2Err({ firstName: true })
      return
    }
    if (!lastName.trim()) {
      setErr('Введите фамилию')
      setS2Err({ lastName: true })
      return
    }
    if (!birthDate) {
      setErr('Выберите дату рождения')
      setS2Err({ birthDate: true })
      return
    }
    if (!teamValue) {
      setErr('Выберите команду')
      setS2Err({ team: true })
      return
    }

    setLoading(true)
    try {
      const { data } = await http.post<{ user: User; accessToken: string }>('/api/auth/register', {
        login: login.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        role,
        teamValue,
      })
      setAuth(data.accessToken, data.user)
      nav('/feed', { replace: true })
    } catch (ex: unknown) {
      const errBody =
        typeof ex === 'object' && ex !== null && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      if (errBody === 'Login already taken') {
        setErr('Этот логин уже занят')
        setS1Err({ login: true })
        setStep(1)
      } else {
        setErr('Не удалось зарегистрироваться')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-app">
      <header className="pt-[max(0.25rem,env(safe-area-inset-top))]">
        {step === 1 ? (
          <AuthBackBar />
        ) : (
          <AuthBackBar
            onBack={() => {
              setStep(1)
              clearFormErr()
            }}
          />
        )}
      </header>

      <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mb-6 text-center">
          <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[28px]">Регистрация</h1>
          <p className="mt-2 text-[15px] text-muted">Vinyl Dance Family</p>
          <p className="mt-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-muted">
            Шаг {step} из 2
          </p>
        </div>

        {step === 1 ? (
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <form noValidate onSubmit={nextStep} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="reg-login"
                  className={cn('text-[13px]', s1Err.login ? 'text-red-400/95' : 'text-muted')}
                >
                  Логин
                </Label>
                <Input
                  id="reg-login"
                  autoComplete="username"
                  value={login}
                  invalid={!!s1Err.login}
                  onChange={(e) => {
                    setLogin(e.target.value)
                    if (err || s1Err.login) {
                      setErr(null)
                      setS1Err((x) => ({ ...x, login: false }))
                    }
                  }}
                  maxLength={32}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="reg-password"
                  className={cn('text-[13px]', s1Err.password ? 'text-red-400/95' : 'text-muted')}
                >
                  Пароль (мин. 8 символов)
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  invalid={!!s1Err.password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (err || s1Err.password) {
                      setErr(null)
                      setS1Err((x) => ({ ...x, password: false }))
                    }
                  }}
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
              {err ? (
                <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-center text-[13px] leading-snug text-red-300">
                  {err}
                </p>
              ) : null}
              <Button type="submit" className="w-full shadow-md" size="lg">
                Далее
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <form noValidate onSubmit={onSubmit} className="space-y-4">
              {teamsError ? (
                <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-center text-[13px] text-red-300">
                  {teamsError}
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="fn"
                    className={cn('text-[13px]', s2Err.firstName ? 'text-red-400/95' : 'text-muted')}
                  >
                    Имя
                  </Label>
                  <Input
                    id="fn"
                    value={firstName}
                    invalid={!!s2Err.firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                      if (err || s2Err.firstName) {
                        setErr(null)
                        setS2Err((x) => ({ ...x, firstName: false }))
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="ln"
                    className={cn('text-[13px]', s2Err.lastName ? 'text-red-400/95' : 'text-muted')}
                  >
                    Фамилия
                  </Label>
                  <Input
                    id="ln"
                    value={lastName}
                    invalid={!!s2Err.lastName}
                    onChange={(e) => {
                      setLastName(e.target.value)
                      if (err || s2Err.lastName) {
                        setErr(null)
                        setS2Err((x) => ({ ...x, lastName: false }))
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="bd"
                  className={cn('text-[13px]', s2Err.birthDate ? 'text-red-400/95' : 'text-muted')}
                >
                  Дата рождения
                </Label>
                <Input
                  id="bd"
                  type="date"
                  value={birthDate}
                  invalid={!!s2Err.birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value)
                    if (err || s2Err.birthDate) {
                      setErr(null)
                      setS2Err((x) => ({ ...x, birthDate: false }))
                    }
                    }}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn('text-[13px]', s2Err.team ? 'text-red-400/95' : 'text-muted')}>
                  Команда
                </Label>
                <Select
                  value={teamValue}
                  onValueChange={(v) => {
                    setTeamValue(v)
                    if (err || s2Err.team) {
                      setErr(null)
                      setS2Err((x) => ({ ...x, team: false }))
                    }
                  }}
                  disabled={teamsLoading || teams.length === 0}
                >
                  <SelectTrigger
                    className={cn(
                      s2Err.team &&
                        'border-red-500/55 bg-red-500/[0.09] focus:ring-2 focus:ring-red-500/45',
                    )}
                    aria-invalid={s2Err.team || undefined}
                  >
                    <SelectValue placeholder={teamsLoading ? 'Загрузка…' : 'Выберите команду'} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {err ? (
                <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-center text-[13px] leading-snug text-red-300">
                  {err}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-row-reverse">
                <Button type="submit" className="w-full shadow-md sm:flex-1" size="lg" disabled={loading}>
                  {loading ? '…' : 'Создать аккаунт'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:flex-1"
                  onClick={() => {
                    setStep(1)
                    clearFormErr()
                  }}
                >
                  Назад
                </Button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-8 text-center text-[15px] text-muted">
          Уже есть аккаунт?{' '}
          <Link className="font-semibold text-accent hover:underline" to="/login">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
