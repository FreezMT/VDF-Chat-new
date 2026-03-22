/** Express 5 may type params as string | string[] */
export function paramString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key]
  if (v === undefined) return undefined
  return typeof v === 'string' ? v : v[0]
}
