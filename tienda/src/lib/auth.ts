import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'
import { db } from '@/db'
import { correoPermitido, leerAllowlist } from './allowlist'

const allowlist = leerAllowlist()

/**
 * Acceso con Google SSO y allowlist de correos (SPEC §9.3). La tienda publica no
 * tiene cuentas de clienta: esta instancia solo protege /admin.
 *
 * La allowlist se aplica en `databaseHooks.user.create.before`, que corre en el
 * primer inicio de sesion de cada correo (no hay email/password, asi que no hay
 * otra via de creacion de usuario). Devolver `false` aborta la creacion — Better
 * Auth responde con un error generico al cliente y no se crea sesion. Un correo
 * de la allowlist se promueve a `role: 'admin'` en el mismo hook: en esta app
 * cualquiera que pase el filtro ES la administradora, no hay un rol intermedio.
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
          if (!correoPermitido(user.email, allowlist)) return false
          return { data: { ...user, role: 'admin' } }
        },
      },
    },
  },
  // `nextCookies()` tiene que ser el ultimo plugin — ver docs de Better Auth.
  plugins: [admin(), nextCookies()],
})
