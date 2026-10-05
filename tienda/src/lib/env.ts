/**
 * Variables de entorno, con la misma forma que `packages/env` de
 * starter-next-auth: se leen en cada acceso (getters) para que los tests puedan
 * cambiarlas y para que importar este modulo nunca falle por si solo. La que
 * falta revienta al usarla, no al arrancar: el smoke de CI arranca la imagen sin
 * credenciales de R2 y debe responder igual.
 */

export function required(name: string): string {
  const value = process.env[name]
  if (value) return value
  // En `next build` no hay secretos: el Dockerfile construye con SKIP_ENV_VALIDATION=1.
  if (process.env.SKIP_ENV_VALIDATION === '1') return ''
  throw new Error(`Falta la variable de entorno ${name}`)
}

export function optional(name: string): string | undefined {
  const value = process.env[name]
  return value ? value : undefined
}

export const env = {
  get databaseUrl() {
    return required('DATABASE_URL')
  },
  get betterAuthSecret() {
    return required('BETTER_AUTH_SECRET')
  },
  get betterAuthUrl() {
    return optional('BETTER_AUTH_URL') ?? 'http://localhost:3000'
  },
  // Opcionales aqui: en desarrollo se entra con `scripts/sesion-admin-dev.mjs`. En
  // produccion los exige src/lib/auth.ts.
  get googleClientId() {
    return optional('GOOGLE_CLIENT_ID')
  },
  get googleClientSecret() {
    return optional('GOOGLE_CLIENT_SECRET')
  },
  /**
   * Correos separados por coma que nacen admin. `ADMIN_ALLOWLIST` es el nombre
   * anterior: se sigue leyendo para no romper un Coolify ya configurado.
   */
  get adminEmails() {
    return process.env.ADMIN_EMAILS ?? process.env.ADMIN_ALLOWLIST ?? ''
  },
  get nodeEnv() {
    return process.env.NODE_ENV ?? 'development'
  },
}
