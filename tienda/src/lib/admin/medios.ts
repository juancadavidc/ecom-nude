import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { imagenes as imagenesTabla } from '@/db/schema'
import { almacen } from '@/lib/almacen'
import { ANCHOS_PRODUCTO, FORMATOS, type Formato } from '@/lib/fotos'
import type { MedioProcesado } from './fotos-proceso'

/**
 * Fotos subidas desde el panel: viven en el almacen de objetos (R2 en
 * produccion) bajo `media/<id>-<ancho>.<formato>` y se sirven en
 * `/media/<id>-<ancho>.<formato>` desde `app/media/[archivo]/route.ts`. En la
 * base solo queda la ruta "/media/<id>" en `imagenes`.
 */

/** Id de medio a partir de la ruta "/media/<id>". null si la foto es del catalogo inicial. */
export function idMedio(ruta: string): string | null {
  return ruta.startsWith('/media/') ? ruta.slice('/media/'.length) : null
}

const ARCHIVO = /^([0-9a-f-]{36})-(\d+)\.(avif|webp|jpg)$/

/** "<uuid>-960.webp" → partes. null si el nombre no tiene esa forma. */
export function parsearArchivo(archivo: string): { id: string; ancho: number; formato: Formato } | null {
  const m = ARCHIVO.exec(archivo)
  if (!m) return null
  return { id: m[1], ancho: Number(m[2]), formato: m[3] as Formato }
}

export const TIPO_CONTENIDO = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' } as const

export function claveMedio(id: string, ancho: number, formato: Formato): string {
  return `media/${id}-${ancho}.${formato}`
}

/** Las seis claves de un medio: todos los anchos en todos los formatos. */
export function clavesMedio(id: string): string[] {
  return ANCHOS_PRODUCTO.flatMap((w) => FORMATOS.map((f) => claveMedio(id, w, f)))
}

/**
 * Sube las variantes de una foto. Si alguna falla, borra las que alcanzaron a
 * subir para no dejar huerfanas y relanza el error original.
 */
export async function guardarMedio(id: string, procesados: MedioProcesado[]) {
  const claves = procesados.map((m) => claveMedio(id, m.ancho, m.formato))
  const resultados = await Promise.allSettled(
    procesados.map((m, i) => almacen().guardar(claves[i], m.datos, TIPO_CONTENIDO[m.formato])),
  )
  const fallo = resultados.find((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (fallo) {
    await almacen()
      .borrar(claves)
      .catch((e: unknown) => console.error('No se pudieron borrar las variantes huerfanas', claves, e))
    throw fallo.reason
  }
}

/** Borra del almacen las fotos subidas que ya ninguna imagen usa. */
export async function limpiarMedios(rutas: string[]) {
  const ids = rutas.map(idMedio).filter((x): x is string => Boolean(x))
  for (const id of ids) {
    const [usada] = await db
      .select({ id: imagenesTabla.id })
      .from(imagenesTabla)
      .where(eq(imagenesTabla.ruta, `/media/${id}`))
      .limit(1)
    if (usada) continue
    // Un fallo al borrar deja basura en el bucket, no un dato roto: se registra y sigue.
    await almacen()
      .borrar(clavesMedio(id))
      .catch((e: unknown) => console.error('limpiarMedios', id, e))
  }
}
