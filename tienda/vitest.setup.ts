import { config } from 'dotenv'
import os from 'node:os'
import path from 'node:path'
import { toTestDatabaseUrl } from './src/db/test-db'

// Cada worker apunta a la base de test (creada en vitest.global-setup.ts) antes de que
// cualquier test importe '@/db'.
config({ path: '.env.local', quiet: true })
process.env.DATABASE_URL = toTestDatabaseUrl(process.env.DATABASE_URL ?? '')
process.env.BETTER_AUTH_SECRET ||= 'test-secret-test-secret-test-secret-00'
process.env.BETTER_AUTH_URL ||= 'http://localhost:3000'

// Los tests nunca escriben en R2 aunque el .env.local tenga credenciales: almacen local
// en un directorio temporal por worker.
process.env.R2_ACCOUNT_ID = ''
process.env.ALMACEN_LOCAL_DIR = path.join(os.tmpdir(), `nude-almacen-test-${process.pid}`)
