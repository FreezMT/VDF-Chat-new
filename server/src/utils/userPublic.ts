import type { Team, User } from '@prisma/client'

export function toUserPublic(user: User & { team?: Team | null }) {
  return {
    id: user.id,
    visibleId: user.visibleId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    birthDate: user.birthDate,
    avatarUrl: user.avatarUrl,
    teamId: user.teamId,
    team: user.team ? { id: user.team.id, name: user.team.name } : null,
    createdAt: user.createdAt,
  }
}
