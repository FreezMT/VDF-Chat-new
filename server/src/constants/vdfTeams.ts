/** data-value → отображаемое имя команды (совпадает с Team.name в БД) */
export const VDF_TEAM_OPTIONS: { value: string; label: string }[] = [
  { value: 'vinyl-dance-family', label: 'Vinyl Dance Family' },
  { value: 'vinyl-junior-family', label: 'Vinyl Junior Family' },
  { value: 'vinyl-kids-family', label: 'Vinyl Kids Family' },
  { value: 'vdf-crew', label: 'VDF Crew' },
  { value: 'vdf-kids-crew', label: 'VDF Kids Crew' },
  { value: 'Аделя 10+', label: 'Аделя 10+' },
  { value: 'Ди 10+', label: 'Ди 10+' },
  { value: 'Аделя 18+', label: 'Аделя 18+' },
  { value: 'Алексей 10+', label: 'Алексей 10+' },
  { value: 'Вика 9+', label: 'Вика 9+' },
  { value: 'Алексей 12+ Гжель', label: 'Алексей 12+ Гжель' },
  { value: 'Ангелина 7+', label: 'Ангелина 7+' },
  { value: 'Аврора 7+', label: 'Аврора 7+' },
  { value: 'Ангелина 12+', label: 'Ангелина 12+' },
  { value: 'Ангелина 14+', label: 'Ангелина 14+' },
  { value: '6 Состав', label: '6 Состав' },
  { value: '7 Состав', label: '7 Состав' },
  { value: 'Crazy Parents', label: 'Crazy Parents' },
  { value: 'Алексей 7+ Реутов', label: 'Алексей 7+ Реутов' },
  { value: 'Вика 7+ Реутов', label: 'Вика 7+ Реутов' },
]

const allowed = new Set(VDF_TEAM_OPTIONS.map((t) => t.value))

export function isAllowedTeamValue(value: string): boolean {
  return allowed.has(value)
}

export function teamLabelFromValue(value: string): string | undefined {
  return VDF_TEAM_OPTIONS.find((t) => t.value === value)?.label
}
