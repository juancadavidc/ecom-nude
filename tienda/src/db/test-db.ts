import postgres from 'postgres'

/**
 * Los tests corren contra `<base>_test` para no tocar nunca la base de
 * desarrollo (la semilla de los tests la vacia y la vuelve a llenar). Misma
 * regla que `packages/db/src/test-url.ts` de starter-next-auth.
 */
export function toTestDatabaseUrl(url: string): string {
  const parsed = new URL(url)
  const name = parsed.pathname.replace(/^\//, '')
  if (!name) throw new Error('DATABASE_URL no trae nombre de base de datos')
  if (name.endsWith('_test')) return url
  parsed.pathname = `/${name}_test`
  return parsed.toString()
}

async function adminQuery(url: string, query: string): Promise<void> {
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'
  const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} })
  try {
    await admin.unsafe(query)
  } finally {
    await admin.end()
  }
}

export async function dropDatabase(url: string): Promise<void> {
  await adminQuery(url, `drop database if exists "${new URL(url).pathname.slice(1)}" with (force)`)
}

/** Borra (si existe) y vuelve a crear la base apuntada por `url`. */
export async function recreateDatabase(url: string): Promise<void> {
  await dropDatabase(url)
  await adminQuery(url, `create database "${new URL(url).pathname.slice(1)}"`)
}
