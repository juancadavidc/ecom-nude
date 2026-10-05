// Arranque del contenedor: primero la base al dia, despues el servidor de Next.
// Las migraciones no pueden correr en el build (ahi no hay Postgres), asi que este es el
// unico momento en que se aplican en produccion. Si fallan, el contenedor muere: es
// preferible a servir contra un esquema viejo. esbuild empaqueta este archivo (con
// postgres y drizzle) a dist/entrypoint.mjs; en runtime no hay TypeScript.
import { spawn } from 'node:child_process'
import { constants } from 'node:os'
import path from 'node:path'
import { runMigrations } from '../src/db/migrate'

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? path.resolve(import.meta.dirname, 'migrations')
const SERVER = path.resolve(import.meta.dirname, 'server.js')

async function migrate(): Promise<void> {
  if (process.env.SKIP_MIGRATIONS === '1') {
    console.log('→ SKIP_MIGRATIONS=1: se arranca sin tocar la base.')
    return
  }
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Falta la variable de entorno DATABASE_URL')
  console.log('→ Aplicando migraciones pendientes…')
  await runMigrations({ databaseUrl, migrationsFolder: MIGRATIONS_DIR })
  console.log('→ Migraciones al dia.')
}

function startServer(): void {
  const server = spawn(process.execPath, [SERVER], { stdio: 'inherit' })
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => server.kill(signal))
  }
  // Se propaga la salida del server. Con senal se usa la convencion 128 + numero: volver
  // a enviarse la senal no sirve porque este proceso ya la intercepta.
  server.on('exit', (code, signal) => {
    process.exit(signal ? 128 + (constants.signals[signal] ?? 0) : (code ?? 0))
  })
}

try {
  await migrate()
} catch (error) {
  console.error('✗ Error aplicando migraciones:', error)
  process.exit(1)
}
startServer()
