import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as authSchema from './auth-schema'
import * as schema from './schema'

// En desarrollo, el hot reload de Next reevalua modulos: se reutiliza el pool para no
// agotar conexiones. postgres.js no abre sockets hasta la primera consulta, asi que
// `next build` (sin base) puede importar este modulo.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql }
const client = globalForDb.pgClient ?? postgres(env.databaseUrl, { max: 10 })
if (env.nodeEnv !== 'production') globalForDb.pgClient = client

export const db = drizzle(client, { schema: { ...schema, ...authSchema } })
