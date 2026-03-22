import { prisma } from '../prisma.js'

export async function generateUniqueVisibleId(): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const id = String(Math.floor(1_000_000 + Math.random() * 9_000_000))
    const exists = await prisma.user.findUnique({ where: { visibleId: id } })
    if (!exists) return id
  }
  throw new Error('Could not generate unique visibleId')
}
