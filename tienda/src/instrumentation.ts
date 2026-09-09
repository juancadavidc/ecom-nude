/**
 * Hook oficial de Next: se llama una vez por instancia del servidor y debe
 * terminar antes de que el servidor acepte peticiones.
 *
 * Solo migra en local (`npm run dev`, NODE_ENV=development). En el contenedor
 * NODE_ENV=production (ver Dockerfile) y la migracion corre como paso explicito
 * del entrypoint, antes de `next start` — con mas de una replica, varios
 * `register()` disparando la migracion a la vez no serian un paso serializado ni
 * quedarian en los logs del deploy como un solo evento.
 *
 * `register()` se ejecuta en todos los runtimes de Next; el driver de Postgres no
 * existe en el runtime Edge, de ahi la guarda de NEXT_RUNTIME.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'production') {
    const { runMigrations } = await import('./db/migrate')
    await runMigrations()
  }
}
