import { useEffect } from 'react'
import { connectSocket, disconnectSocket, reconnectSocket } from '@/services/socket'
import { useAuthStore } from '@/stores/authStore'

export function useSocketConnection(): void {
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket()
      return
    }
    connectSocket()
    return () => {
      disconnectSocket()
    }
  }, [accessToken])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && useAuthStore.getState().accessToken) {
        reconnectSocket()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])
}
