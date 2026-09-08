import 'dotenv/config'

/**
 * Corre una vez antes de toda la suite. Migra y vuelve a sembrar la base LOCAL de
 * `docker-compose-local.yaml` en cada corrida de `npm test` — es una base
 * descartable, así que borrar y resembrar en cada test run es intencional, no un
 * accidente: si tenías datos de prueba metidos a mano en el panel, `npm test` los
 * va a reemplazar por el seed de `productos.json`.
 */
export default async function setup() {
  const { runMigrations } = await import('./src/db/migrate')
  await runMigrations()
  const { seed } = await import('./src/db/seed')
  await seed()
}
