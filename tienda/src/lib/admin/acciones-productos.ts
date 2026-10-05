'use server'

import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import {
  categorias as categoriasTabla,
  combinaCon as combinaConTabla,
  imagenes as imagenesTabla,
  productos as productosTabla,
  variantes as variantesTabla,
} from '@/db/schema'
import { fotosPorColor, skusOcupados } from './datos'
import { limpiarMedios } from './medios'
import { validarProducto } from './producto-form'
import { exito, fallo, type Resultado } from './resultado'
import { revalidarTienda } from './revalidar'
import { exigirAdmin } from './sesion'

export async function guardarProducto(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()

  const id = String(formData.get('id') ?? '') || null
  let crudo: unknown
  try {
    crudo = JSON.parse(String(formData.get('datos') ?? ''))
  } catch {
    return fallo('El formulario llegó incompleto. Recarga la página e inténtalo de nuevo.')
  }

  const anterior = id
    ? (
        await db
          .select({ slug: productosTabla.slug, categoria: productosTabla.categoria })
          .from(productosTabla)
          .where(eq(productosTabla.id, id))
          .limit(1)
      )[0]
    : null
  if (id && !anterior) return fallo('Este producto ya no existe. Vuelve a la lista.')

  const fotos = id ? await fotosPorColor(id) : {}
  const v = validarProducto(crudo, { fotosPorColor: fotos })
  if (!v.ok) return fallo('Revisa los campos marcados.', v.errores)
  const d = v.datos

  // Lo que depende de la base: categoria existente, slug libre, SKU libres, combina con validos.
  const errores: Record<string, string> = {}
  const [cat] = await db
    .select({ slug: categoriasTabla.slug })
    .from(categoriasTabla)
    .where(eq(categoriasTabla.slug, d.categoria))
    .limit(1)
  if (!cat) errores.categoria = 'Esa categoría ya no existe. Elige otra.'
  const [otroSlug] = await db
    .select({ id: productosTabla.id })
    .from(productosTabla)
    .where(and(eq(productosTabla.slug, d.slug), id ? ne(productosTabla.id, id) : undefined))
    .limit(1)
  if (otroSlug) errores.slug = 'Otro producto ya usa esta dirección. Cámbiala, por ejemplo agregando el color.'
  const ocupados = await skusOcupados(
    d.variantes.map((x) => x.sku),
    id ?? undefined,
  )
  if (ocupados.length) errores.variantes = `El SKU ${ocupados[0]} ya lo usa otro producto. Cambia el código del color.`
  const combina = d.combinaCon.filter((x) => x !== id)
  if (combina.length) {
    const existen = await db
      .select({ id: productosTabla.id })
      .from(productosTabla)
      .where(inArray(productosTabla.id, combina))
    const ok = new Set(existen.map((e) => e.id))
    d.combinaCon = combina.filter((x) => ok.has(x))
  }
  if (Object.keys(errores).length) return fallo('Revisa los campos marcados.', errores)

  const valores = {
    slug: d.slug,
    nombre: d.nombre,
    categoria: d.categoria,
    marca: d.marca || null,
    precio: d.precio,
    descripcion: d.descripcion,
    detalles: d.detalles,
    estado: d.estado,
    destacado: d.destacado,
    seoTitulo: d.seo.titulo,
    seoDescripcion: d.seo.descripcion,
    seoAlt: d.seo.alt,
    actualizadoEn: new Date(),
  }

  let productoId = id
  try {
    await db.transaction(async (tx) => {
      if (productoId) {
        await tx.update(productosTabla).set(valores).where(eq(productosTabla.id, productoId))
      } else {
        // La coleccion no se edita en el panel: un producto nuevo hereda la del mas reciente.
        const [ultimo] = await tx
          .select({ coleccion: productosTabla.coleccion })
          .from(productosTabla)
          .orderBy(desc(productosTabla.creadoEn))
          .limit(1)
        const [nuevo] = await tx
          .insert(productosTabla)
          .values({ ...valores, coleccion: ultimo?.coleccion ?? 'Temporada 2026' })
          .returning({ id: productosTabla.id })
        productoId = nuevo.id
      }
      const pid = productoId!

      // Colores renombrados: las fotos siguen al color. En dos pasos, por si dos
      // colores intercambian nombre.
      const renombrados = d.colores.filter((c) => c.original && c.original !== c.nombre)
      for (const [i, c] of renombrados.entries()) {
        await tx
          .update(imagenesTabla)
          .set({ color: `__renombrando-${i}` })
          .where(and(eq(imagenesTabla.productoId, pid), eq(imagenesTabla.color, c.original!)))
      }
      for (const [i, c] of renombrados.entries()) {
        await tx
          .update(imagenesTabla)
          .set({ color: c.nombre })
          .where(and(eq(imagenesTabla.productoId, pid), eq(imagenesTabla.color, `__renombrando-${i}`)))
      }
      await tx.delete(variantesTabla).where(eq(variantesTabla.productoId, pid))
      const colorDe = new Map(d.colores.map((c) => [c.nombre, c]))
      await tx.insert(variantesTabla).values(
        d.variantes.map((x) => ({
          productoId: pid,
          color: x.color,
          hex: colorDe.get(x.color)!.hex.toLowerCase(),
          talla: x.talla,
          sku: x.sku,
          disponible: x.disponible,
          precio: colorDe.get(x.color)!.precio,
        })),
      )

      await tx.delete(combinaConTabla).where(eq(combinaConTabla.productoId, pid))
      if (d.combinaCon.length) {
        await tx
          .insert(combinaConTabla)
          .values(d.combinaCon.map((otro, orden) => ({ productoId: pid, combinaConId: otro, orden })))
      }
    })
  } catch (e) {
    console.error('guardarProducto', e)
    return fallo('No se pudo guardar. Inténtalo de nuevo en un momento.')
  }

  revalidarTienda(anterior, { categoria: d.categoria, slug: d.slug })
  if (!id) redirect(`/admin/productos/${productoId}?creado=1`)
  return exito('Cambios guardados.')
}

/** "Archivar" = volver a borrador: sale de la tienda pero no se pierde nada. */
export async function archivarProducto(id: string): Promise<Resultado> {
  await exigirAdmin()
  const [p] = await db
    .update(productosTabla)
    .set({ estado: 'borrador', actualizadoEn: new Date() })
    .where(eq(productosTabla.id, String(id)))
    .returning({ slug: productosTabla.slug, categoria: productosTabla.categoria })
  if (!p) return fallo('Este producto ya no existe.')
  revalidarTienda(p)
  return exito('Archivado. Ya no se ve en la tienda.')
}

export async function eliminarProducto(id: string): Promise<Resultado> {
  await exigirAdmin()
  const rutas = await db
    .select({ ruta: imagenesTabla.ruta })
    .from(imagenesTabla)
    .where(eq(imagenesTabla.productoId, String(id)))
  const [p] = await db
    .delete(productosTabla)
    .where(eq(productosTabla.id, String(id)))
    .returning({ slug: productosTabla.slug, categoria: productosTabla.categoria, nombre: productosTabla.nombre })
  if (!p) return fallo('Este producto ya no existe.')
  await limpiarMedios(rutas.map((r) => r.ruta))
  revalidarTienda(p)
  redirect(`/admin/productos?eliminado=${encodeURIComponent(p.nombre)}`)
}
