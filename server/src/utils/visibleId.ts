import { prisma } from './prisma.js'

function randomDigits(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000))
}

export async function generateUniqueVisibleId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const id = randomDigits()
    const exists = await prisma.user.findUnique({ where: { visibleId: id } })
    if (!exists) return id
  }
  throw new Error('Could not generate visibleId')
}
