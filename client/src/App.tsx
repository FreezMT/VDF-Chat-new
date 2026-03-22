import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { bare, http } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import { useSocketConnection } from '@/hooks/useSocket'
import { AppShell } from '@/components/layout/AppShell'
import { WelcomePage } from '@/pages/WelcomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { FeedPage } from '@/pages/FeedPage'
import { PlusPage } from '@/pages/PlusPage'
import { ChatsPage } from '@/pages/ChatsPage'
import { ChatRoomPage } from '@/pages/ChatRoomPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'

function Bootstrap({ children }: { children: ReactNode }) {
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const { data } = await bare.post<{ accessToken: string }>('/api/auth/refresh')
        if (cancelled) return
        setAccessToken(data.accessToken)
        const me = await http.get<User>('/api/users/me')
        if (cancelled) return
        setUser(me.data)
      } catch {
        /* not logged in */
      } finally {
        if (!cancelled) setBootstrapped(true)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [setAccessToken, setUser, setBootstrapped])

  return children
}

function Guarded() {
  useSocketConnection()
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  return <AppShell />
}

function AdminGate() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/feed" replace />
  return <AdminPage />
}

export default function App() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const user = useAuthStore((s) => s.user)

  return (
    <BrowserRouter>
      <Bootstrap>
        {!bootstrapped ? (
          <div className="flex h-[100dvh] items-center justify-center bg-app text-[15px] text-muted">
            Загрузка…
          </div>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/feed" replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/feed" replace /> : <RegisterPage />}
            />
            <Route
              path="/"
              element={user ? <Navigate to="/feed" replace /> : <WelcomePage />}
            />
            <Route element={<Guarded />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/plus" element={<PlusPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/chats/:chatId" element={<ChatRoomPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminGate />} />
            </Route>
            <Route path="*" element={<Navigate to={user ? '/feed' : '/'} replace />} />
          </Routes>
        )}
      </Bootstrap>
    </BrowserRouter>
  )
}
