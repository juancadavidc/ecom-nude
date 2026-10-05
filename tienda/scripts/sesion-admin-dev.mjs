#!/usr/bin/env node
/**
 * SOLO DESARROLLO. Crea (o reusa) una usuaria admin y le abre una sesion de
 * Better Auth en la base local, sin pasar por Google. Sirve para manejar
 * /admin con Playwright o a mano.
 *
 *   node scripts/sesion-admin-dev.mjs            imprime la cookie firmada
 *   node scripts/sesion-admin-dev.mjs --json     { name, value } para Playwright
 *
 * En el navegador: DevTools, Application, Cookies, http://localhost:<puerto>,
 * crear `better-auth.session_token` con el valor impreso. Dura 7 dias.
 *
 * Better Auth firma la cookie como `<token>.<HMAC-SHA256(token, secreto) en
 * base64>` y la guarda codificada con encodeURIComponent (better-call,
 * `signCookieValue`). Se replica aqui con node:crypto.
 */
import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'

if (process.env.NODE_ENV === 'production') {
  console.error('sesion-admin-dev: se niega a correr con NODE_ENV=production.')
  process.exit(1)
}

config({ path: '.env.local', quiet: true })
const { DATABASE_URL, BETTER_AUTH_SECRET } = process.env
if (!DATABASE_URL || !BETTER_AUTH_SECRET) {
  console.error('Faltan DATABASE_URL o BETTER_AUTH_SECRET en .env.local')
  process.exit(1)
}
const host = new URL(DATABASE_URL).hostname
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.error(`sesion-admin-dev: DATABASE_URL apunta a "${host}", no a una base local. No se toca.`)
  process.exit(1)
}

const CORREO = process.env.ADMIN_DEV_EMAIL ?? 'admin-dev@nude.local'
const sql = postgres(DATABASE_URL, { max: 1 })

try {
  const ahora = new Date()
  const [existente] = await sql`select id from "user" where email = ${CORREO}`
  const userId = existente?.id ?? randomUUID()
  if (existente) {
    await sql`update "user" set role = 'admin', updated_at = ${ahora} where id = ${userId}`
  } else {
    await sql`
      insert into "user" (id, name, email, email_verified, role, created_at, updated_at)
      values (${userId}, 'Admin de desarrollo', ${CORREO}, true, 'admin', ${ahora}, ${ahora})`
  }

  const token = randomBytes(24).toString('base64url')
  const vence = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await sql`
    insert into session (id, token, user_id, expires_at, created_at, updated_at, user_agent)
    values (${randomUUID()}, ${token}, ${userId}, ${vence}, ${ahora}, ${ahora}, 'sesion-admin-dev')`

  const firma = createHmac('sha256', BETTER_AUTH_SECRET).update(token).digest('base64')
  const valor = encodeURIComponent(`${token}.${firma}`)

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ name: 'better-auth.session_token', value: valor }))
  } else {
    console.log(`Usuaria: ${CORREO}`)
    console.log(`Cookie:  better-auth.session_token=${valor}`)
  }
} finally {
  await sql.end()
}
