'use server'

import { and, asc, eq, max } from 'drizzle-orm'
import { db } from '@/db'
import {
  imagenes as imagenesTabla,
  medios as mediosTabla,
  productos as productosTabla,
  variantes as variantesTabla,
} from '@/db/schema'
import { ErrorFoto, procesarFoto, validarArchivo } from './fotos-proceso'
import { limpiarMedios } from './medios'
import { exito, fallo, type Resultado } from './resultado'
import { revalidarTienda } from './revalidar'
import { exigirAdmin } from './sesion'

async function producto(id: string) {
  const [p] = await db
    .select({ id: productosTabla.id, slug: productosTabla.slug, categoria: productosTabla.categoria, estado: productosTabla.estado })
    .from(productosTabla)
    .where(eq(productosTabla.id, id))
    .limit(1)
  return p ?? null
}

async function colorExiste(productoId: string, color: string) {
  const [v] = await db
    .select({ id: variantesTabla.id })
    .from(variantesTabla)
    .where(and(eq(variantesTabla.productoId, productoId), eq(variantesTabla.color, color)))
    .limit(1)
  return Boolean(v)
}

/** Deja el orden de un color en 0..n-1, en el orden actual. */
async function compactarOrden(productoId: string, color: string) {
  const filas = await db
    .select({ id: imagenesTabla.id })
    .from(imagenesTabla)
    .where(and(eq(imagenesTabla.productoId, productoId), eq(imagenesTabla.color, color)))
    .orderBy(asc(imagenesTabla.orden))
  for (const [i, f] of filas.entries()) {
    await db.update(imagenesTabla).set({ orden: i }).where(eq(imagenesTabla.id, f.id))
  }
}

/**
 * Si un producto activo se queda sin fotos, vuelve a borrador: la regla de
 * publicacion vale tambien despues de publicar. Devuelve el aviso para Daniela.
 */
async function protegerPublicacion(productoId: string): Promise<string> {
  const [hay] = await db
    .select({ id: imagenesTabla.id })
    .from(imagenesTabla)
    .where(eq(imagenesTabla.productoId, productoId))
    .limit(1)
  if (hay) return ''
  const [p] = await db
    .update(productosTabla)
    .set({ estado: 'borrador' })
    .where(and(eq(productosTabla.id, productoId), eq(productosTabla.estado, 'activo')))
    .returning({ id: productosTabla.id })
  return p ? ' Era la última foto, así que el producto pasó a borrador.' : ''
}

async function tocar(productoId: string) {
  await db.update(productosTabla).set({ actualizadoEn: new Date() }).where(eq(productosTabla.id, productoId))
}

/** Una foto por llamada: el cliente las envia de a una para mostrar progreso y no pasar el limite de cuerpo. */
export async function subirFoto(formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const productoId = String(formData.get('productoId') ?? '')
  const color = String(formData.get('color') ?? '')
  const archivo = formData.get('archivo')

  const p = await producto(productoId)
  if (!p) return fallo('Este producto ya no existe.')
  if (!(await colorExiste(productoId, color))) return fallo(`El color "${color}" no está guardado. Guarda el producto primero.`)
  if (!(archivo instanceof File)) return fallo('No llegó ninguna foto. Elige una e inténtalo de nuevo.')

  const invalido = validarArchivo(archivo.name, archivo.type, archivo.size)
  if (invalido) return fallo(invalido)

  let procesados
  try {
    procesados = await procesarFoto(Buffer.from(await archivo.arrayBuffer()), { nombre: archivo.name, tipo: archivo.type })
  } catch (e) {
    if (e instanceof ErrorFoto) return fallo(e.message)
    console.error('subirFoto', e)
    return fallo(`No pudimos procesar "${archivo.name}". Inténtalo de nuevo o prueba con otra foto.`)
  }

  const id = crypto.randomUUID()
  await db.transaction(async (tx) => {
    await tx.insert(mediosTabla).values(procesados.map((m) => ({ id, ancho: m.ancho, formato: m.formato, datos: m.datos })))
    const [ultimo] = await tx
      .select({ orden: max(imagenesTabla.orden) })
      .from(imagenesTabla)
      .where(and(eq(imagenesTabla.productoId, productoId), eq(imagenesTabla.color, color)))
    await tx
      .insert(imagenesTabla)
      .values({ productoId, color, ruta: `/media/${id}`, orden: (ultimo?.orden ?? -1) + 1 })
  })
  await tocar(productoId)
  revalidarTienda(p)
  return exito(`"${archivo.name}" quedó en ${color}.`)
}

export async function moverFoto(imagenId: string, direccion: -1 | 1): Promise<Resultado> {
  await exigirAdmin()
  const [img] = await db.select().from(imagenesTabla).where(eq(imagenesTabla.id, String(imagenId))).limit(1)
  if (!img) return fallo('Esta foto ya no existe.')
  const hermanas = await db
    .select({ id: imagenesTabla.id })
    .from(imagenesTabla)
    .where(and(eq(imagenesTabla.productoId, img.productoId), eq(imagenesTabla.color, img.color)))
    .orderBy(asc(imagenesTabla.orden))
  const i = hermanas.findIndex((h) => h.id === img.id)
  const j = i + (direccion === -1 ? -1 : 1)
  if (j < 0 || j >= hermanas.length) return fallo('La foto ya está en el extremo.')
  ;[hermanas[i], hermanas[j]] = [hermanas[j], hermanas[i]]
  for (const [k, h] of hermanas.entries()) {
    await db.update(imagenesTabla).set({ orden: k }).where(eq(imagenesTabla.id, h.id))
  }
  await tocar(img.productoId)
  revalidarTienda(await producto(img.productoId))
  return exito(j === 0 ? 'Ahora es la foto principal del color.' : 'Orden actualizado.')
}

export async function eliminarFoto(imagenId: string): Promise<Resultado> {
  await exigirAdmin()
  const [img] = await db.delete(imagenesTabla).where(eq(imagenesTabla.id, String(imagenId))).returning()
  if (!img) return fallo('Esta foto ya no existe.')
  await compactarOrden(img.productoId, img.color)
  await limpiarMedios([img.ruta])
  const aviso = await protegerPublicacion(img.productoId)
  await tocar(img.productoId)
  revalidarTienda(await producto(img.productoId))
  return exito(`Foto borrada.${aviso}`)
}

export async function cambiarColorFoto(imagenId: string, color: string): Promise<Resultado> {
  await exigirAdmin()
  const [img] = await db.select().from(imagenesTabla).where(eq(imagenesTabla.id, String(imagenId))).limit(1)
  if (!img) return fallo('Esta foto ya no existe.')
  if (img.color === color) return fallo('La foto ya está en ese color.')
  if (!(await colorExiste(img.productoId, String(color)))) return fallo(`El color "${color}" no existe en este producto.`)
  const [ultimo] = await db
    .select({ orden: max(imagenesTabla.orden) })
    .from(imagenesTabla)
    .where(and(eq(imagenesTabla.productoId, img.productoId), eq(imagenesTabla.color, color)))
  await db
    .update(imagenesTabla)
    .set({ color, orden: (ultimo?.orden ?? -1) + 1 })
    .where(eq(imagenesTabla.id, img.id))
  await compactarOrden(img.productoId, img.color)
  await tocar(img.productoId)
  revalidarTienda(await producto(img.productoId))
  return exito(`Foto movida a ${color}.`)
}
