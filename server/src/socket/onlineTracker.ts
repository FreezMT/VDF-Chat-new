import type { Server } from 'socket.io'
import { refreshUserOnline, setUserOffline } from '../redis.js'

const socketsByUser = new Map<string, Set<string>>()

export function registerSocket(io: Server, userId: string, socketId: string): void {
  let set = socketsByUser.get(userId)
  if (!set) {
    set = new Set()
    socketsByUser.set(userId, set)
  }
  const first = set.size === 0
  set.add(socketId)
  void refreshUserOnline(userId)
  if (first) io.emit('user:online', { userId })
}

export async function unregisterSocket(
  io: Server,
  userId: string,
  socketId: string,
): Promise<void> {
  const set = socketsByUser.get(userId)
  if (!set) return
  set.delete(socketId)
  if (set.size === 0) {
    socketsByUser.delete(userId)
    await setUserOffline(userId)
    io.emit('user:offline', { userId })
  }
}
