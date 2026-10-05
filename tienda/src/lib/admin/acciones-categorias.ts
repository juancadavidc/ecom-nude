'use server'

import { asc, count, eq, max } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { categorias as categoriasTabla, productos as productosTabla } from '@/db/schema'
import { slugificar } from '@/lib/producto-modelo'
import { exito, fallo, type Resultado } from './resultado'
import { exigirAdmin } from './sesion'

/**
 * Rutas que la tienda ya ocupa: una categoria con ese slug quedaria tapada por
 * la pagina fija (o la taparia).
 */
const RESERVADOS = new Set([
  'admin', 'api', 'media', 'fotos', 'colecciones', 'login', 'sistema', 'checkout', 'carrito', 'pedido',
  'buscar', 'cuenta', 'nosotros', 'contacto', 'envios', 'cambios', 'legales', 'guia-de-tallas',
])
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function revalidar(...slugs: string[]) {
  // El menu de categorias vive en el layout de la tienda: se invalida todo.
  revalidatePath('/', 'layout')
  for (const s of slugs) revalidatePath(`/${s}`)
}

function leer(formData: FormData) {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const slug = slugificar(String(formData.get('slug') ?? '').trim() || nombre)
  const intro = String(formData.get('intro') ?? '').trim()
  const errores: Record<string, string> = {}
  if (!nombre) errores.nombre = 'Escribe el nombre de la categoría.'
  if (!slug || !SLUG.test(slug)) errores.slug = 'Usa solo letras sin tildes, números y guiones.'
  else if (RESERVADOS.has(slug)) errores.slug = `"${slug}" ya es una página de la tienda. Elige otra dirección.`
  if (intro.length > 240) errores.intro = 'La intro es de dos líneas: déjala en menos de 240 caracteres.'
  return { nombre, slug, intro, errores }
}

async function slugOcupado(slug: string) {
  const [c] = await db.select({ slug: categoriasTabla.slug }).from(categoriasTabla).where(eq(categoriasTabla.slug, slug)).limit(1)
  return Boolean(c)
}

export async function crearCategoria(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const { nombre, slug, intro, errores } = leer(formData)
  if (!errores.slug && (await slugOcupado(slug))) errores.slug = 'Ya hay una categoría con esa dirección.'
  if (Object.keys(errores).length) return fallo('Revisa los campos marcados.', errores)
  const [ultimo] = await db.select({ orden: max(categoriasTabla.orden) }).from(categoriasTabla)
  await db.insert(categoriasTabla).values({ slug, nombre, intro, orden: (ultimo?.orden ?? 0) + 1, visible: true })
  revalidar(slug)
  return exito(`Categoría "${nombre}" creada.`)
}

export async function editarCategoria(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const original = String(formData.get('original') ?? '')
  const { nombre, slug, intro, errores } = leer(formData)
  if (!errores.slug && slug !== original && (await slugOcupado(slug))) errores.slug = 'Ya hay una categoría con esa dirección.'
  if (Object.keys(errores).length) return fallo('Revisa los campos marcados.', errores)
  // El slug es la llave: la FK de productos tiene ON UPDATE CASCADE, asi que los productos lo siguen.
  const [c] = await db
    .update(categoriasTabla)
    .set({ slug, nombre, intro })
    .where(eq(categoriasTabla.slug, original))
    .returning({ slug: categoriasTabla.slug })
  if (!c) return fallo('Esta categoría ya no existe.')
  revalidar(original, slug)
  return exito(slug !== original ? `Guardada. Ahora vive en /${slug}.` : 'Cambios guardados.')
}

export async function alternarVisible(slug: string): Promise<Resultado> {
  await exigirAdmin()
  const [c] = await db.select().from(categoriasTabla).where(eq(categoriasTabla.slug, String(slug))).limit(1)
  if (!c) return fallo('Esta categoría ya no existe.')
  await db.update(categoriasTabla).set({ visible: !c.visible }).where(eq(categoriasTabla.slug, c.slug))
  revalidar(c.slug)
  return exito(c.visible ? `"${c.nombre}" ya no aparece en el menú.` : `"${c.nombre}" vuelve a aparecer en el menú.`)
}

export async function moverCategoria(slug: string, direccion: -1 | 1): Promise<Resultado> {
  await exigirAdmin()
  const todas = await db
    .select({ slug: categoriasTabla.slug })
    .from(categoriasTabla)
    .orderBy(asc(categoriasTabla.orden), asc(categoriasTabla.nombre))
  const i = todas.findIndex((c) => c.slug === slug)
  const j = i + (direccion === -1 ? -1 : 1)
  if (i < 0 || j < 0 || j >= todas.length) return fallo('Ya está en el extremo.')
  ;[todas[i], todas[j]] = [todas[j], todas[i]]
  for (const [k, c] of todas.entries()) {
    await db.update(categoriasTabla).set({ orden: k + 1 }).where(eq(categoriasTabla.slug, c.slug))
  }
  revalidar()
  return exito('Orden actualizado.')
}

export async function eliminarCategoria(slug: string): Promise<Resultado> {
  await exigirAdmin()
  const [{ n }] = await db.select({ n: count() }).from(productosTabla).where(eq(productosTabla.categoria, String(slug)))
  if (n > 0) {
    return fallo(
      `Tiene ${n === 1 ? 'un producto' : `${n} productos`}. Pásalos a otra categoría antes de borrarla, o escóndela del menú.`,
    )
  }
  const [c] = await db.delete(categoriasTabla).where(eq(categoriasTabla.slug, String(slug))).returning()
  if (!c) return fallo('Esta categoría ya no existe.')
  revalidar(c.slug)
  return exito(`Categoría "${c.nombre}" borrada.`)
}
