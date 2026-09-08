export function leerAllowlist(valor = process.env.ADMIN_ALLOWLIST ?? ''): string[] {
  return valor
    .split(',')
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean)
}

export function correoPermitido(correo: string, allowlist: string[]): boolean {
  return allowlist.includes(correo.trim().toLowerCase())
}
