/**
 * Claves de objeto. Las fotos de producto viven en dos prefijos con el mismo
 * esquema de nombre `<base>-<ancho>.<formato>`:
 *
 *   fotos/p/<nombre>   catalogo inicial, subido con `npm run fotos:subir`
 *   media/<uuid>       subidas desde el panel
 *
 * Segmentos [A-Za-z0-9._-], sin vacios ni "..": una clave asi no escapa del
 * bucket ni del directorio local.
 */
export function esClaveSegura(clave: string): boolean {
  if (!clave) return false
  return clave.split('/').every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== '.' && s !== '..')
}

const TIPOS: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

export function tipoDeClave(clave: string): string {
  const ext = /\.([a-z0-9]+)$/i.exec(clave)?.[1]?.toLowerCase() ?? ''
  return TIPOS[ext] ?? 'application/octet-stream'
}
