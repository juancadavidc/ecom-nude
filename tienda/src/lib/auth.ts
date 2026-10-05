import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'
import { db } from '@/db'
import { correoPermitido, leerAllowlist } from './allowlist'
import { env, required } from './env'

/**
 * En produccion Google es el unico login: sin credenciales la app no debe
 * arrancar (en `next build` corre con SKIP_ENV_VALIDATION=1 y no aplica). En
 * desarrollo, sin credenciales, se entra con `scripts/sesion-admin-dev.mjs`.
 */
function socialProviders() {
  if (env.googleClientId && env.googleClientSecret) {
    return { google: { clientId: env.googleClientId, clientSecret: env.googleClientSecret } }
  }
  if (env.nodeEnv === 'production') {
    required('GOOGLE_CLIENT_ID')
    required('GOOGLE_CLIENT_SECRET')
  }
  return {}
}

/**
 * Endpoints HTTP del plugin admin (/api/auth/admin/*). El panel no los usa: los
 * roles salen de ADMIN_EMAILS al crear la cuenta. Expuestos, cualquier admin
 * podria cambiar roles, banear o suplantar por HTTP sin pasar por ninguna regla
 * de la app. Se apagan todos, como en starter-next-auth; `auth.api.*` en el
 * servidor sigue funcionando porque `disabledPaths` solo filtra peticiones HTTP.
 */
export const DISABLED_ADMIN_PATHS = [
  '/admin/set-role',
  '/admin/get-user',
  '/admin/create-user',
  '/admin/update-user',
  '/admin/list-users',
  '/admin/list-user-sessions',
  '/admin/unban-user',
  '/admin/ban-user',
  '/admin/impersonate-user',
  '/admin/stop-impersonating',
  '/admin/revoke-user-session',
  '/admin/revoke-user-sessions',
  '/admin/remove-user',
  '/admin/set-user-password',
  '/admin/has-permission',
]

/**
 * Acceso con Google SSO (SPEC §9.3). Cualquier correo puede crear cuenta —
 * `/admin` no es la puerta de entrada, es un panel que unos pocos correos
 * pueden ver. La allowlist decide el rol, no si se puede loguear.
 *
 * `databaseHooks.user.create.before` corre en el primer inicio de sesion de
 * cada correo (no hay email/password, asi que no hay otra via de creacion de
 * usuario): si el correo esta en `ADMIN_EMAILS`, se promueve a
 * `role: 'admin'`; si no, no se toca `role` y el plugin `admin()` le pone su
 * default (`'user'`) — el hook simplemente no participa. `AdminLayout`
 * (`src/app/admin/layout.tsx`) es quien de verdad protege el panel, exigiendo
 * `session.user.role === 'admin'`.
 *
 * OJO al tocar este hook: devolver `false` en vez de dejar pasar sin
 * modificar rompe el login de Google — es un bug real de better-auth@1.5.6.
 * En el flujo de OAuth (`db/internal-adapter.ts` → `createOAuthUser`), un
 * `before` que devuelve `false` hace que `createWithHooks` devuelva `null`,
 * y el paso siguiente (crear la cuenta vinculada) lee `.id` de ese `null` sin
 * verificar — `TypeError` en vez de un rechazo limpio.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: env.betterAuthUrl,
  basePath: '/api/auth',
  secret: env.betterAuthSecret,
  disabledPaths: DISABLED_ADMIN_PATHS,
  socialProviders: socialProviders(),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Se lee en cada alta para que cambiar la variable no requiera reiniciar.
          if (!correoPermitido(user.email, leerAllowlist())) return
          return { data: { ...user, role: 'admin' } }
        },
      },
    },
  },
  // `nextCookies()` tiene que ser el ultimo plugin — ver docs de Better Auth.
  plugins: [admin(), nextCookies()],
})
