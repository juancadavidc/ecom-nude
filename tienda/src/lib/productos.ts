import { and, asc, desc, eq, exists, gt, gte, inArray, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { combinaCon as combinaConTabla, imagenes as imagenesTabla, productos as productosTabla, variantes as variantesTabla } from '@/db/schema'
import type { Categoria, Orden, Producto, Talla, Variante } from './producto-modelo'
import { TALLAS, esCategoria } from './producto-modelo'

/**
 * EL ADAPTADOR. Unico modulo del sitio que importa `@/db`.
 *
 * Las cuatro funciones conservan la firma de la fase 1: es literalmente lo que su
 * propio comentario anticipaba — "cambia el cuerpo de estas cuatro funciones y
 * ningun componente se toca". El cuerpo ahora consulta Postgres via Drizzle.
 *
 * Dos capas de integridad, como pedia el comentario original: los constraints de
 * la base (FK, unique, enums — ver src/db/schema.test.ts) y `validarProducto`, que
 * corre sobre cada fila antes de devolverla.
 */

type FilaProducto = typeof productosTabla.$inferSelect

type Cursor = { precio?: number; creadoEn: string }

function decodificarCursor(valor: string | undefined): Cursor | null {
  if (!valor) return null
  try {
    const datos = JSON.parse(Buffer.from(valor, 'base64url').toString('utf8'))
    if (typeof datos?.creadoEn !== 'string') return null
    return datos as Cursor
  } catch {
    // Un cursor que no se entiende es un cursor de otra version del sitio. Se
    // empieza por el principio en vez de devolver vacio.
    return null
  }
}

function codificarCursor(fila: FilaProducto): string {
  const cursor: Cursor = { precio: fila.precio, creadoEn: fila.creadoEn.toISOString() }
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

/**
 * `creadoEn` es siempre el desempate, sin importar el orden pedido: preserva el
 * orden del seed (= el orden del archivo) para dos productos del mismo precio,
 * igual que el `Array.sort` estable que usaba el mock.
 */
function condicionCursor(orden: Orden, cursor: Cursor | null): SQL | undefined {
  if (!cursor) return undefined
  const creadoEn = new Date(cursor.creadoEn)
  if (orden === 'precio-asc') {
    return or(
      gt(productosTabla.precio, cursor.precio!),
      and(eq(productosTabla.precio, cursor.precio!), gt(productosTabla.creadoEn, creadoEn)),
    )
  }
  if (orden === 'precio-desc') {
    return or(
      lt(productosTabla.precio, cursor.precio!),
      and(eq(productosTabla.precio, cursor.precio!), gt(productosTabla.creadoEn, creadoEn)),
    )
  }
  return gt(productosTabla.creadoEn, creadoEn)
}

/**
 * Color y talla se cruzan sobre la MISMA variante y solo cuentan si tiene stock —
 * igual regla que `pasaVariantes` en filtros.ts, aqui como EXISTS correlacionado.
 */
function condicionVariantes(colores: string[], tallas: Talla[]): SQL | undefined {
  if (!colores.length && !tallas.length) return undefined
  const condiciones = [
    eq(variantesTabla.productoId, productosTabla.id),
    sql`${variantesTabla.stock} > 0`,
    colores.length ? inArray(variantesTabla.color, colores) : undefined,
    tallas.length ? inArray(variantesTabla.talla, tallas) : undefined,
  ].filter((c): c is SQL => c != null)
  return exists(db.select().from(variantesTabla).where(and(...condiciones)))
}

function validarProducto(p: Producto): Producto {
  if (!esCategoria(p.categoria)) {
    throw new Error(`Producto ${p.slug}: categoria invalida "${p.categoria}"`)
  }
  for (const v of p.variantes) {
    if (!(TALLAS as readonly string[]).includes(v.talla)) {
      throw new Error(`Producto ${p.slug}: talla invalida "${v.talla}" en SKU ${v.sku}`)
    }
  }
  for (const color of Object.keys(p.imagenes)) {
    if (!p.variantes.some((v) => v.color === color)) {
      throw new Error(`Producto ${p.slug}: imagenes del color "${color}" sin variante correspondiente`)
    }
  }
  return p
}

async function combinaConDe(ids: string[]): Promise<Map<string, string[]>> {
  if (!ids.length) return new Map()
  const filas = await db
    .select({ productoId: combinaConTabla.productoId, slug: productosTabla.slug })
    .from(combinaConTabla)
    .innerJoin(productosTabla, eq(productosTabla.id, combinaConTabla.combinaConId))
    .where(inArray(combinaConTabla.productoId, ids))
    .orderBy(asc(combinaConTabla.orden))

  const mapa = new Map<string, string[]>()
  for (const fila of filas) {
    const lista = mapa.get(fila.productoId) ?? []
    lista.push(fila.slug)
    mapa.set(fila.productoId, lista)
  }
  return mapa
}

async function armarProductos(filas: FilaProducto[]): Promise<Producto[]> {
  if (!filas.length) return []
  const ids = filas.map((f) => f.id)

  const [variantesFilas, imagenesFilas, combinaConPorId] = await Promise.all([
    db.select().from(variantesTabla).where(inArray(variantesTabla.productoId, ids)),
    db
      .select()
      .from(imagenesTabla)
      .where(inArray(imagenesTabla.productoId, ids))
      .orderBy(asc(imagenesTabla.orden)),
    combinaConDe(ids),
  ])

  return filas.map((fila) => {
    const variantes: Variante[] = variantesFilas
      .filter((v) => v.productoId === fila.id)
      .map((v) => ({ color: v.color, hex: v.hex, talla: v.talla, sku: v.sku, stock: v.stock }))

    const imagenes: Record<string, string[]> = {}
    for (const img of imagenesFilas.filter((i) => i.productoId === fila.id)) {
      ;(imagenes[img.color] ??= []).push(img.ruta)
    }

    return validarProducto({
      nombre: fila.nombre,
      slug: fila.slug,
      categoria: fila.categoria,
      coleccion: fila.coleccion,
      precio: fila.precio,
      descripcion: fila.descripcion,
      detalles: fila.detalles,
      variantes,
      imagenes,
      combina_con: combinaConPorId.get(fila.id) ?? [],
      estado: fila.estado,
      seo: { titulo: fila.seoTitulo, descripcion: fila.seoDescripcion, alt: fila.seoAlt },
    })
  })
}

export type OpcionesListado = {
  categoria?: Categoria
  colores?: string[]
  tallas?: Talla[]
  precio?: { min?: number; max?: number }
  orden?: Orden
  cursor?: string
  limite?: number
}

export async function listarProductos(
  opts: OpcionesListado = {},
): Promise<{ productos: Producto[]; siguiente: string | null }> {
  const { categoria, colores = [], tallas = [], precio = {}, orden = 'novedad', cursor, limite } = opts

  const condiciones = [
    categoria ? eq(productosTabla.categoria, categoria) : undefined,
    precio.min != null ? gte(productosTabla.precio, precio.min) : undefined,
    precio.max != null ? lte(productosTabla.precio, precio.max) : undefined,
    condicionVariantes(colores, tallas),
    condicionCursor(orden, decodificarCursor(cursor)),
  ].filter((c): c is SQL => c != null)

  const ordenColumnas =
    orden === 'precio-asc'
      ? [asc(productosTabla.precio), asc(productosTabla.creadoEn)]
      : orden === 'precio-desc'
        ? [desc(productosTabla.precio), asc(productosTabla.creadoEn)]
        : [asc(productosTabla.creadoEn)]

  const consulta = db
    .select()
    .from(productosTabla)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(...ordenColumnas)

  const filas = limite != null ? await consulta.limit(limite + 1) : await consulta
  const hayMas = limite != null && filas.length > limite
  const pagina = hayMas ? filas.slice(0, limite) : filas

  return {
    productos: await armarProductos(pagina),
    siguiente: hayMas ? codificarCursor(pagina[pagina.length - 1]) : null,
  }
}

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  const [fila] = await db.select().from(productosTabla).where(eq(productosTabla.slug, slug)).limit(1)
  if (!fila) return null
  const [producto] = await armarProductos([fila])
  return producto
}

/** SPEC §4.1 bloque 5 — cuatro en grilla. Nada agotado: no se destaca lo que no se puede vender. */
export async function destacados(limite = 4): Promise<Producto[]> {
  const { productos } = await listarProductos()
  const { estadoVisible } = await import('./producto-modelo')
  return productos.filter((p) => estadoVisible(p) !== 'agotado').slice(0, limite)
}

/** SPEC §4.3 — "Completa el look". Respeta el orden de `combina_con`. */
export async function combinaCon(slug: string): Promise<Producto[]> {
  const producto = await obtenerProducto(slug)
  if (!producto) return []
  const resultados = await Promise.all(producto.combina_con.map((otro) => obtenerProducto(otro)))
  return resultados.filter((p): p is Producto => Boolean(p))
}
