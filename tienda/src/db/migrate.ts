import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Clave del pg_advisory_lock que serializa las migraciones entre replicas. No debe
// cambiar entre despliegues.
export const MIGRATION_LOCK_KEY = 1_627_384_950

export const DEFAULT_MIGRATIONS_FOLDER = path.resolve(process.cwd(), 'drizzle')

/**
 * Aplica las migraciones pendientes. Si dos contenedores arrancan a la vez, el
 * segundo espera el lock y luego no encuentra nada pendiente. Abre y cierra su
 * propia conexion: corre antes de que exista el pool de la app.
 */
export async function runMigrations(opts: { databaseUrl: string; migrationsFolder?: string }): Promise<void> {
  const client = postgres(opts.databaseUrl, { max: 1, onnotice: () => {} })
  try {
    await client`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`
    try {
      await migrate(drizzle(client), { migrationsFolder: opts.migrationsFolder ?? DEFAULT_MIGRATIONS_FOLDER })
    } finally {
      await client`select pg_advisory_unlock(${MIGRATION_LOCK_KEY})`
    }
  } finally {
    await client.end()
  }
}
