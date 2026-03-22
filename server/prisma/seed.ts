import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@vdf.local'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'adminadmin'
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    console.log('Seed: admin already exists')
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const visibleId = '1000000'
  const taken = await prisma.user.findUnique({ where: { visibleId } })
  const vid = taken ? undefined : visibleId

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'VDF',
      role: 'admin',
      visibleId: vid ?? (await uniqueVisibleId()),
    },
  })
  console.log('Seed: created admin', user.email, user.visibleId)
}

async function uniqueVisibleId(): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const id = String(Math.floor(1_000_000 + Math.random() * 9_000_000))
    const e = await prisma.user.findUnique({ where: { visibleId: id } })
    if (!e) return id
  }
  throw new Error('visibleId')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
