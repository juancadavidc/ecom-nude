import { servirObjeto } from '@/lib/almacen'
import { claveMedio, parsearArchivo } from '@/lib/admin/medios'

/**
 * Fotos subidas desde el panel: `/media/<id>-<ancho>.<avif|webp|jpg>`, leidas
 * del almacen de objetos (R2 en produccion). Publica: la tienda las pide igual
 * que a las del catalogo inicial.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await ctx.params
  const partes = parsearArchivo(archivo)
  if (!partes) return new Response('No encontrada', { status: 404 })
  return servirObjeto(claveMedio(partes.id, partes.ancho, partes.formato))
}
