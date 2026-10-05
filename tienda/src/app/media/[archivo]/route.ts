import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { medios } from '@/db/schema'
import { parsearArchivo, TIPO_CONTENIDO } from '@/lib/admin/medios'

/**
 * Fotos subidas desde el panel: `/media/<id>-<ancho>.<avif|webp|jpg>`.
 * Publica: la tienda las pide igual que a las estaticas de `public/fotos`.
 *
 * Un id nunca cambia de contenido (reemplazar una foto es subir otra con otro
 * id), asi que la respuesta se cachea un año y se marca inmutable.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await ctx.params
  const partes = parsearArchivo(archivo)
  if (!partes) return new Response('No encontrada', { status: 404 })

  const [fila] = await db
    .select({ datos: medios.datos })
    .from(medios)
    .where(and(eq(medios.id, partes.id), eq(medios.ancho, partes.ancho), eq(medios.formato, partes.formato)))
    .limit(1)
  if (!fila) return new Response('No encontrada', { status: 404 })

  return new Response(new Uint8Array(fila.datos), {
    headers: {
      'Content-Type': TIPO_CONTENIDO[partes.formato],
      'Content-Length': String(fila.datos.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
