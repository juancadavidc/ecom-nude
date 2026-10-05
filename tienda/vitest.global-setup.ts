import { config } from 'dotenv'
import { runMigrations } from './src/db/migrate'
import { dropDatabase, recreateDatabase, toTestDatabaseUrl } from './src/db/test-db'

config({ path: '.env.local', quiet: true })

/**
 * Corre una vez antes de toda la suite: crea `<base>_test` desde cero, la migra
 * y la siembra con `productos.json`. La base de desarrollo nunca se toca. Los
 * tests asumen `docker compose -f docker-compose.local.yaml up -d` ya corrido
 * (en CI, el Postgres efimero de node-ci).
 */
export default async function setup() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (copia .env.example a .env.local)')
  const testUrl = toTestDatabaseUrl(process.env.DATABASE_URL)
  await recreateDatabase(testUrl)
  await runMigrations({ databaseUrl: testUrl })

  process.env.DATABASE_URL = testUrl
  const { seed } = await import('./src/db/seed')
  await seed()

  return async () => {
    await dropDatabase(testUrl)
  }
}
