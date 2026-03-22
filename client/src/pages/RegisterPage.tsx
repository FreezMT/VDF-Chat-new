import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { register } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { reconnectSocket } from '@/services/socket'
import type { Role } from '@/types'

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [role, setRole] = useState<Extract<Role, 'dancer' | 'parent'>>('dancer')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await register({
        firstName,
        lastName,
        email,
        password,
        role,
        ...(birthDate ? { birthDate: new Date(birthDate).toISOString() } : {}),
      })
      setUser(data.user)
      reconnectSocket()
      navigate('/feed', { replace: true })
    } catch {
      setError('Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="flex min-h-dvh flex-col justify-center px-6 py-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Регистрация</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="fn">Имя</Label>
              <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln">Фамилия</Label>
              <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bd">Дата рождения</Label>
            <Input id="bd" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Роль</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={role === 'dancer' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setRole('dancer')}
              >
                Танцор
              </Button>
              <Button
                type="button"
                variant={role === 'parent' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setRole('parent')}
              >
                Родитель
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Создание…' : 'Создать аккаунт'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
