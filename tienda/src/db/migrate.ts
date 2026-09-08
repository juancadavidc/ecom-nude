import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './index'

export async function runMigrations() {
  console.log('Corriendo migraciones...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migraciones completas.')
}
