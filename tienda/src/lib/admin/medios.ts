import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { imagenes as imagenesTabla, medios as mediosTabla } from '@/db/schema'

/**
 * Fotos subidas desde el panel: viven en `medios` (ver schema) y se sirven en
 * `/media/<id>-<ancho>.<formato>` desde `app/media/[archivo]/route.ts`.
 */

/** Id de medio a partir de la ruta "/media/<id>". null si la foto es estatica. */
export function idMedio(ruta: string): string | null {
  return ruta.startsWith('/media/') ? ruta.slice('/media/'.length) : null
}

const ARCHIVO = /^([0-9a-f-]{36})-(\d+)\.(avif|webp|jpg)$/

/** "<uuid>-960.webp" → partes. null si el nombre no tiene esa forma. */
export function parsearArchivo(archivo: string): { id: string; ancho: number; formato: 'avif' | 'webp' | 'jpg' } | null {
  const m = ARCHIVO.exec(archivo)
  if (!m) return null
  return { id: m[1], ancho: Number(m[2]), formato: m[3] as 'avif' | 'webp' | 'jpg' }
}

export const TIPO_CONTENIDO = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' } as const

/** Borra de `medios` las fotos subidas que ya ninguna imagen usa. */
export async function limpiarMedios(rutas: string[]) {
  const ids = rutas.map(idMedio).filter((x): x is string => Boolean(x))
  for (const id of ids) {
    const [usada] = await db
      .select({ id: imagenesTabla.id })
      .from(imagenesTabla)
      .where(eq(imagenesTabla.ruta, `/media/${id}`))
      .limit(1)
    if (!usada) await db.delete(mediosTabla).where(eq(mediosTabla.id, id))
  }
}
