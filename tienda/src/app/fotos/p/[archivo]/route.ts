import { servirObjeto } from '@/lib/almacen'

/**
 * Fotos del catalogo inicial: `/fotos/p/<nombre>-<ancho>.<avif|webp|jpg>`.
 * Viven en el almacen de objetos bajo `fotos/p/` (las sube `npm run
 * fotos:subir`), no en `public/`: asi la imagen de Docker no carga el catalogo y
 * todas las fotos de producto quedan en el mismo lugar que las del panel.
 */
const ARCHIVO = /^[a-z0-9-]+-\d+\.(avif|webp|jpg)$/

export async function GET(_req: Request, ctx: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await ctx.params
  if (!ARCHIVO.test(archivo)) return new Response('No encontrada', { status: 404 })
  return servirObjeto(`fotos/p/${archivo}`)
}
