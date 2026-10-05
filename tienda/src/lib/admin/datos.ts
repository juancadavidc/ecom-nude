import { and, asc, count, desc, eq, inArray, ne, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  categorias as categoriasTabla,
  combinaCon as combinaConTabla,
  imagenes as imagenesTabla,
  pedidoItems as pedidoItemsTabla,
  pedidos as pedidosTabla,
  productos as productosTabla,
  variantes as variantesTabla,
} from '@/db/schema'
import { TALLAS, type EstadoProducto, type Talla } from '@/lib/producto-modelo'
import { ESTADOS_PEDIDO, type EstadoPedido } from './pedidos-estado'
import { codigoDeColor, type ColorEditor, type VarianteEditor } from './variantes'

/**
 * Lecturas del panel. A diferencia de `lib/productos.ts` (el adaptador de la
 * tienda), aqui se ve todo: borradores, marca interna, ids.
 */

export type FiltroEstado = EstadoProducto | 'sin-fotos'

export type FilaProductoPanel = {
  id: string
  slug: string
  nombre: string
  categoria: string
  categoriaNombre: string
  marca: string | null
  precio: number
  precioMax: number
  estado: EstadoProducto
  destacado: boolean
  colores: { nombre: string; hex: string }[]
  fotos: number
  primeraFoto: string | null
  actualizadoEn: Date
}

/** Para buscar sin que importen tildes ni mayusculas: "tela fria" encuentra "Tela Fría". */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export async function listarProductosPanel(
  filtros: { q?: string; categoria?: string; estado?: FiltroEstado } = {},
): Promise<FilaProductoPanel[]> {
  const [filas, vars, imgs, cats] = await Promise.all([
    db
      .select()
      .from(productosTabla)
      .where(filtros.categoria ? eq(productosTabla.categoria, filtros.categoria) : undefined)
      .orderBy(desc(productosTabla.actualizadoEn), asc(productosTabla.creadoEn)),
    db
      .select({
        productoId: variantesTabla.productoId,
        color: variantesTabla.color,
        hex: variantesTabla.hex,
        precio: variantesTabla.precio,
        sku: variantesTabla.sku,
      })
      .from(variantesTabla),
    db
      .select({ productoId: imagenesTabla.productoId, color: imagenesTabla.color, ruta: imagenesTabla.ruta })
      .from(imagenesTabla)
      .orderBy(asc(imagenesTabla.orden)),
    db.select({ slug: categoriasTabla.slug, nombre: categoriasTabla.nombre }).from(categoriasTabla),
  ])
  const nombreCat = new Map(cats.map((c) => [c.slug, c.nombre]))
  const q = normalizarBusqueda(filtros.q ?? '')

  const resultado: FilaProductoPanel[] = []
  for (const p of filas) {
    const misVars = vars.filter((v) => v.productoId === p.id)
    const misImgs = imgs.filter((i) => i.productoId === p.id)
    const colores = new Map<string, string>()
    for (const v of misVars) if (!colores.has(v.color)) colores.set(v.color, v.hex)
    const precios = [...colores.keys()].map((c) => misVars.find((v) => v.color === c && v.precio != null)?.precio ?? p.precio)
    // La primera foto del primer color que tenga fotos, en el orden de los colores.
    const primerColor = [...colores.keys()].find((c) => misImgs.some((i) => i.color === c))
    const fila: FilaProductoPanel = {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      categoria: p.categoria,
      categoriaNombre: nombreCat.get(p.categoria) ?? p.categoria,
      marca: p.marca,
      precio: precios.length ? Math.min(...precios) : p.precio,
      precioMax: precios.length ? Math.max(...precios) : p.precio,
      estado: p.estado,
      destacado: p.destacado,
      colores: [...colores].map(([nombre, hex]) => ({ nombre, hex })),
      fotos: misImgs.length,
      primeraFoto: misImgs.find((i) => i.color === primerColor)?.ruta ?? null,
      actualizadoEn: p.actualizadoEn,
    }
    if (filtros.estado === 'sin-fotos' ? fila.fotos > 0 : filtros.estado && fila.estado !== filtros.estado) continue
    if (q) {
      const pajar = normalizarBusqueda(
        [p.nombre, p.slug, p.marca ?? '', ...misVars.map((v) => v.sku), ...colores.keys()].join(' '),
      )
      if (!q.split(/\s+/).every((t) => pajar.includes(t))) continue
    }
    resultado.push(fila)
  }
  return resultado
}

/** Cuantos productos hay por estado, y cuantos no tienen ninguna foto. */
export async function resumenProductos(): Promise<Record<FiltroEstado | 'todos', number>> {
  const [porEstado, sinFotos] = await Promise.all([
    db.select({ estado: productosTabla.estado, n: count() }).from(productosTabla).groupBy(productosTabla.estado),
    db
      .select({ n: count() })
      .from(productosTabla)
      .where(sql`not exists (select 1 from ${imagenesTabla} where ${imagenesTabla.productoId} = ${productosTabla.id})`),
  ])
  const r = { todos: 0, activo: 0, agotado: 0, proximamente: 0, borrador: 0, 'sin-fotos': sinFotos[0]?.n ?? 0 }
  for (const f of porEstado) {
    r[f.estado] = f.n
    r.todos += f.n
  }
  return r
}

export type FotoPanel = { id: string; color: string; ruta: string; orden: number }

export type ProductoPanel = {
  id: string
  slug: string
  nombre: string
  categoria: string
  coleccion: string
  marca: string
  precio: number
  descripcion: string
  detalles: string[]
  estado: EstadoProducto
  destacado: boolean
  seo: { titulo: string; descripcion: string; alt: string }
  colores: ColorEditor[]
  tallas: Talla[]
  variantes: VarianteEditor[]
  fotos: FotoPanel[]
  combinaCon: string[]
}

export async function obtenerProductoPanel(id: string): Promise<ProductoPanel | null> {
  const [p] = await db.select().from(productosTabla).where(eq(productosTabla.id, id)).limit(1)
  if (!p) return null
  const [vars, fotos, combina] = await Promise.all([
    db.select().from(variantesTabla).where(eq(variantesTabla.productoId, id)),
    db
      .select({ id: imagenesTabla.id, color: imagenesTabla.color, ruta: imagenesTabla.ruta, orden: imagenesTabla.orden })
      .from(imagenesTabla)
      .where(eq(imagenesTabla.productoId, id))
      .orderBy(asc(imagenesTabla.color), asc(imagenesTabla.orden)),
    db
      .select({ id: combinaConTabla.combinaConId })
      .from(combinaConTabla)
      .where(eq(combinaConTabla.productoId, id))
      .orderBy(asc(combinaConTabla.orden)),
  ])

  // Los colores en el orden en que aparecen en las variantes (el mismo que usa la tienda).
  const nombres: string[] = []
  for (const v of vars) if (!nombres.includes(v.color)) nombres.push(v.color)
  const colores: ColorEditor[] = nombres.map((nombre) => {
    const delColor = vars.filter((v) => v.color === nombre)
    return {
      nombre,
      hex: delColor[0].hex,
      precio: delColor.find((v) => v.precio != null)?.precio ?? null,
      codigo: codigoDeColor(delColor),
      original: nombre,
    }
  })
  const hayTalla = new Set(vars.map((v) => v.talla))

  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria,
    coleccion: p.coleccion,
    marca: p.marca ?? '',
    precio: p.precio,
    descripcion: p.descripcion,
    detalles: p.detalles,
    estado: p.estado,
    destacado: p.destacado,
    seo: { titulo: p.seoTitulo, descripcion: p.seoDescripcion, alt: p.seoAlt },
    colores,
    tallas: TALLAS.filter((t) => hayTalla.has(t)),
    variantes: nombres.flatMap((c) =>
      TALLAS.flatMap((t) => {
        const v = vars.find((x) => x.color === c && x.talla === t)
        return v ? [{ color: c, talla: t, sku: v.sku, disponible: v.disponible }] : []
      }),
    ),
    fotos,
    combinaCon: combina.map((c) => c.id),
  }
}

/** Lista corta para elegir "combina con". */
export async function opcionesProductos(excepto?: string) {
  return db
    .select({ id: productosTabla.id, nombre: productosTabla.nombre, estado: productosTabla.estado })
    .from(productosTabla)
    .where(excepto ? ne(productosTabla.id, excepto) : undefined)
    .orderBy(asc(productosTabla.nombre))
}

export async function listarCategoriasPanel() {
  return db
    .select({
      slug: categoriasTabla.slug,
      nombre: categoriasTabla.nombre,
      intro: categoriasTabla.intro,
      orden: categoriasTabla.orden,
      visible: categoriasTabla.visible,
      productos: count(productosTabla.id),
      publicados: sql<number>`count(${productosTabla.id}) filter (where ${productosTabla.estado} <> 'borrador')`.mapWith(
        Number,
      ),
    })
    .from(categoriasTabla)
    .leftJoin(productosTabla, eq(productosTabla.categoria, categoriasTabla.slug))
    .groupBy(categoriasTabla.slug)
    .orderBy(asc(categoriasTabla.orden), asc(categoriasTabla.nombre))
}

export type FilaPedido = typeof pedidosTabla.$inferSelect

export async function listarPedidos(estado?: EstadoPedido, limite = 200): Promise<FilaPedido[]> {
  return db
    .select()
    .from(pedidosTabla)
    .where(estado ? eq(pedidosTabla.estado, estado) : undefined)
    .orderBy(desc(pedidosTabla.creadoEn))
    .limit(limite)
}

export async function resumenPedidos(): Promise<Record<EstadoPedido | 'todos', number>> {
  const filas = await db.select({ estado: pedidosTabla.estado, n: count() }).from(pedidosTabla).groupBy(pedidosTabla.estado)
  const r = Object.fromEntries([['todos', 0], ...ESTADOS_PEDIDO.map((e) => [e, 0])]) as Record<
    EstadoPedido | 'todos',
    number
  >
  for (const f of filas) {
    r[f.estado] = f.n
    r.todos += f.n
  }
  return r
}

export async function obtenerPedido(id: string) {
  const [pedido] = await db.select().from(pedidosTabla).where(eq(pedidosTabla.id, id)).limit(1)
  if (!pedido) return null
  const items = await db
    .select()
    .from(pedidoItemsTabla)
    .where(eq(pedidoItemsTabla.pedidoId, id))
    .orderBy(asc(pedidoItemsTabla.nombre))
  // Categoria de cada producto, para enlazar a su ficha. Puede no existir ya.
  const slugs = [...new Set(items.map((i) => i.productoSlug))]
  const prods = slugs.length
    ? await db
        .select({ slug: productosTabla.slug, categoria: productosTabla.categoria })
        .from(productosTabla)
        .where(inArray(productosTabla.slug, slugs))
    : []
  const categoriaDe = new Map(prods.map((p) => [p.slug, p.categoria]))
  return { pedido, items: items.map((i) => ({ ...i, categoria: categoriaDe.get(i.productoSlug) ?? null })) }
}

/** Fotos de un producto por color, para la regla de publicacion. */
export async function fotosPorColor(productoId: string): Promise<Record<string, number>> {
  const filas = await db
    .select({ color: imagenesTabla.color, n: count() })
    .from(imagenesTabla)
    .where(eq(imagenesTabla.productoId, productoId))
    .groupBy(imagenesTabla.color)
  return Object.fromEntries(filas.map((f) => [f.color, f.n]))
}

/** SKU que ya usa otro producto. */
export async function skusOcupados(skus: string[], exceptoProducto?: string): Promise<string[]> {
  if (!skus.length) return []
  const filas = await db
    .select({ sku: variantesTabla.sku })
    .from(variantesTabla)
    .where(
      and(
        inArray(variantesTabla.sku, skus),
        exceptoProducto ? ne(variantesTabla.productoId, exceptoProducto) : undefined,
      ),
    )
  return filas.map((f) => f.sku)
}
