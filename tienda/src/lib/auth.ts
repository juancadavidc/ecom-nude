import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'
import { db } from '@/db'
import { correoPermitido, leerAllowlist } from './allowlist'

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  !process.env.BETTER_AUTH_SECRET
) {
  throw new Error('BETTER_AUTH_SECRET es obligatorio en produccion — el contenedor no debe arrancar sin el.')
}

const allowlist = leerAllowlist()

/**
 * Acceso con Google SSO (SPEC §9.3). Cualquier correo puede crear cuenta —
 * `/admin` no es la puerta de entrada, es un panel que unos pocos correos
 * pueden ver. La allowlist decide el rol, no si se puede loguear.
 *
 * `databaseHooks.user.create.before` corre en el primer inicio de sesion de
 * cada correo (no hay email/password, asi que no hay otra via de creacion de
 * usuario): si el correo esta en `ADMIN_ALLOWLIST`, se promueve a
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
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!correoPermitido(user.email, allowlist)) return
          return { data: { ...user, role: 'admin' } }
        },
      },
    },
  },
  // `nextCookies()` tiene que ser el ultimo plugin — ver docs de Better Auth.
  plugins: [admin(), nextCookies()],
})
