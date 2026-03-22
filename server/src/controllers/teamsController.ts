import type { Request, Response } from 'express'
import { VDF_TEAM_OPTIONS } from '../constants/vdfTeams.js'

export async function listTeams(_req: Request, res: Response): Promise<void> {
  res.json({ teams: VDF_TEAM_OPTIONS })
}
