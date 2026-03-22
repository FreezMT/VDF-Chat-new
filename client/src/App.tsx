import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useBootstrapAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { FeedPage } from '@/pages/FeedPage'
import { PlusPage } from '@/pages/PlusPage'
import { ChatsPage } from '@/pages/ChatsPage'
import { ChatRoomPage } from '@/pages/ChatRoomPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'

function AppRoutes() {
  const { loading } = useBootstrapAuth()
  const user = useAuthStore((s) => s.user)
  useSocket(!!user && !loading)

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Загрузка…</div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/feed" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/feed" replace /> : <RegisterPage />} />
      <Route
        element={user ? <AppShell /> : <Navigate to="/login" replace />}
      >
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/plus" element={<PlusPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:chatId" element={<ChatRoomPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="/" element={<Navigate to={user ? '/feed' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/feed' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
