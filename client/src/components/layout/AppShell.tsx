import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { SafeArea } from '@/components/layout/SafeArea'

export function AppShell() {
  return (
    <SafeArea className="pb-20">
      <Outlet />
      <BottomNav />
    </SafeArea>
  )
}
