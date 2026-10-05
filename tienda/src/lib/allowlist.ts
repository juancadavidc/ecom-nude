import { env } from './env'

/** `ADMIN_EMAILS`: correos separados por coma que nacen admin. */
export function leerAllowlist(valor = env.adminEmails): string[] {
  return valor
    .split(',')
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean)
}

export function correoPermitido(correo: string, allowlist: string[]): boolean {
  return allowlist.includes(correo.trim().toLowerCase())
}
