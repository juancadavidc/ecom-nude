import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { imagenes, pedidoItems, pedidos, productos, variantes } from '@/db/schema'
import { descuentoPara, envioPara, leerConfig, type Config } from './config'
import { urlFoto } from './fotos'
import {
  LINEAS_MAXIMAS,
  MENSAJES,
  leerCampos,
  limitarCantidad,
  totalDe,
  validarPedido,
  type ErroresCampos,
  type MetodoPago,
} from './pedido-modelo'
import { NOMBRE_TALLA, esTalla } from './producto-modelo'

/**
 * Pedidos del checkout (SPEC §4.5). Solo servidor.
 *
 * Regla de oro: el cliente nunca dice cuánto cuesta algo. Del carrito solo se
 * toma `sku` y `cantidad`; precio, nombre, color, talla e imagen se vuelven a
 * leer de Postgres, y subtotal, envío, descuento y total se calculan aquí.
 */

export type ItemSolicitado = { sku: string; cantidad: number }

export type LineaCotizada = {
  sku: string
  productoSlug: string
  categoria: string
  nombre: string
  color: string
  /** Para el círculo de color cuando el color todavía no tiene foto. */
  hex: string
  talla: string
  /** variante.precio ?? producto.precio, en COP. */
  precio: number
  cantidad: number
  /** URL de la primera foto del color, o '' si no tiene. */
  imagen: string
  /** null si se puede comprar; si no, qué pasa y cómo seguir. */
  problema: string | null
}

export const PROBLEMAS = {
  noExiste: 'Este producto ya no está en la tienda. Quítalo para seguir.',
  agotado: 'Esta talla se agotó por ahora. Quítala para seguir.',
  noALaVenta: 'Este producto todavía no está a la venta. Quítalo para seguir.',
} as const

/**
 * Limpia lo que manda el cliente: descarta lo que no tiene forma de item, une
 * skus repetidos, limita cantidades a 1..10 y corta a 30 líneas.
 */
export function normalizarItems(entrada: unknown): ItemSolicitado[] {
  if (!Array.isArray(entrada)) return []
  const porSku = new Map<string, number>()
  for (const item of entrada) {
    if (typeof item !== 'object' || item === null) continue
    const { sku, cantidad } = item as Record<string, unknown>
    if (typeof sku !== 'string') continue
    const limpio = sku.trim()
    if (!limpio || limpio.length > 64) continue
    porSku.set(limpio, (porSku.get(limpio) ?? 0) + limitarCantidad(cantidad))
  }
  return [...porSku]
    .slice(0, LINEAS_MAXIMAS)
    .map(([sku, cantidad]) => ({ sku, cantidad: limitarCantidad(cantidad) }))
}

/** Relee cada sku de la base y dice, línea por línea, si se puede comprar y a qué precio. */
export async function cotizarItems(entrada: unknown): Promise<LineaCotizada[]> {
  const items = normalizarItems(entrada)
  if (!items.length) return []

  const filas = await db
    .select({
      sku: variantes.sku,
      color: variantes.color,
      hex: variantes.hex,
      talla: variantes.talla,
      disponible: variantes.disponible,
      precioVariante: variantes.precio,
      productoId: productos.id,
      slug: productos.slug,
      categoria: productos.categoria,
      nombre: productos.nombre,
      precio: productos.precio,
      estado: productos.estado,
    })
    .from(variantes)
    .innerJoin(productos, eq(variantes.productoId, productos.id))
    .where(
      inArray(
        variantes.sku,
        items.map((i) => i.sku),
      ),
    )

  const porSku = new Map(filas.map((f) => [f.sku, f]))
  const productoIds = [...new Set(filas.map((f) => f.productoId))]
  const fotos = productoIds.length
    ? await db
        .select({ productoId: imagenes.productoId, color: imagenes.color, ruta: imagenes.ruta })
        .from(imagenes)
        .where(inArray(imagenes.productoId, productoIds))
        .orderBy(asc(imagenes.orden))
    : []
  const primeraFoto = new Map<string, string>()
  for (const f of fotos) {
    const clave = `${f.productoId}|${f.color}`
    if (!primeraFoto.has(clave)) primeraFoto.set(clave, f.ruta)
  }

  return items.map(({ sku, cantidad }): LineaCotizada => {
    const f = porSku.get(sku)
    if (!f) {
      return {
        sku,
        productoSlug: '',
        categoria: '',
        nombre: '',
        color: '',
        hex: '',
        talla: '',
        precio: 0,
        cantidad,
        imagen: '',
        problema: PROBLEMAS.noExiste,
      }
    }
    const foto = primeraFoto.get(`${f.productoId}|${f.color}`)
    let problema: string | null = null
    if (f.estado === 'borrador' || f.estado === 'proximamente') problema = PROBLEMAS.noALaVenta
    else if (f.estado === 'agotado' || !f.disponible) problema = PROBLEMAS.agotado
    return {
      sku,
      productoSlug: f.slug,
      categoria: f.categoria,
      nombre: f.nombre,
      color: f.color,
      hex: f.hex,
      talla: esTalla(f.talla) ? NOMBRE_TALLA[f.talla] : f.talla,
      precio: f.precioVariante ?? f.precio,
      cantidad,
      imagen: foto ? urlFoto(foto, 480) : '',
      problema,
    }
  })
}

export type EntradaPedido = {
  /** Campos del formulario, sin validar. */
  campos: unknown
  /** [{ sku, cantidad }] del carrito. Cualquier otro dato del cliente se ignora. */
  items: unknown
  codigo?: unknown
}

export type ResultadoPedido =
  | { ok: true; id: string; numero: number; total: number }
  | {
      ok: false
      errores: ErroresCampos
      /** sku -> qué pasa con esa línea. */
      erroresItems: Record<string, string>
      /** Error que no es de un campo: carrito vacío, falla de la base. */
      mensaje: string | null
    }

export const MENSAJE_CARRITO_VACIO = 'Todavía no has elegido nada. Agrega algo al carrito para hacer el pedido.'
export const MENSAJE_ITEMS = 'Hay productos que ya no se pueden comprar. Quítalos del pedido para seguir.'

/**
 * Crea el pedido. Valida todo, recalcula todo, y guarda pedido + items en una
 * sola transacción: o queda el pedido completo o no queda nada.
 *
 * `config` se puede inyectar en pruebas; en la tienda se lee de la tabla.
 */
export async function crearPedido(entrada: EntradaPedido, opciones: { config?: Config } = {}): Promise<ResultadoPedido> {
  const validacion = validarPedido(leerCampos(entrada.campos))
  const errores: ErroresCampos = validacion.ok ? {} : { ...validacion.errores }

  const lineas = await cotizarItems(entrada.items)
  const erroresItems: Record<string, string> = {}
  for (const l of lineas) if (l.problema) erroresItems[l.sku] = l.problema

  const cfg = opciones.config ?? (await leerConfig())
  const subtotal = lineas.reduce((s, l) => s + (l.problema ? 0 : l.precio * l.cantidad), 0)

  const codigo = typeof entrada.codigo === 'string' ? entrada.codigo.trim().toUpperCase().slice(0, 40) : ''
  const descuento = codigo ? descuentoPara(codigo, subtotal, cfg.codigosDescuento) : 0
  if (codigo && descuentoPara(codigo, 100, cfg.codigosDescuento) === 0) errores.codigo = MENSAJES.codigoInvalido

  const mensaje = !lineas.length ? MENSAJE_CARRITO_VACIO : Object.keys(erroresItems).length ? MENSAJE_ITEMS : null
  if (!validacion.ok || mensaje || Object.keys(errores).length) {
    return { ok: false, errores, erroresItems, mensaje }
  }

  const datos = validacion.datos
  const envio = envioPara(datos.ciudad, cfg, datos.departamento)
  const total = totalDe({ subtotal, envio, descuento })

  const creado = await db.transaction(async (tx) => {
    const [pedido] = await tx
      .insert(pedidos)
      .values({
        ...datos,
        subtotal,
        envio,
        descuento,
        codigoDescuento: descuento > 0 ? codigo : null,
        total,
      })
      .returning({ id: pedidos.id, numero: pedidos.numero })
    await tx.insert(pedidoItems).values(
      lineas.map((l) => ({
        pedidoId: pedido.id,
        sku: l.sku,
        productoSlug: l.productoSlug,
        nombre: l.nombre,
        color: l.color,
        talla: l.talla,
        precio: l.precio,
        cantidad: l.cantidad,
        imagen: l.imagen,
      })),
    )
    return pedido
  })

  return { ok: true, id: creado.id, numero: creado.numero, total }
}

/** Valida un código de descuento. Devuelve el porcentaje, o null si no sirve. */
export function porcentajeDeCodigo(codigo: string, cfg: Pick<Config, 'codigosDescuento'>): number | null {
  // descuentoPara sobre 100 es exactamente el porcentaje: una sola regla de
  // qué código vale, la de config.ts.
  const pct = descuentoPara(codigo, 100, cfg.codigosDescuento)
  return pct > 0 ? pct : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ItemDePedido = {
  sku: string
  nombre: string
  color: string
  hex: string
  talla: string
  precio: number
  cantidad: number
  imagen: string
}

export type PedidoConfirmado = {
  id: string
  numero: number
  nombre: string
  celular: string
  departamento: string
  ciudad: string
  metodoPago: MetodoPago
  subtotal: number
  envio: number
  descuento: number
  codigoDescuento: string | null
  total: number
  items: ItemDePedido[]
}

/**
 * Lo que necesita la página de confirmación, y nada más: ni dirección ni
 * correo (ver la nota en app/(checkout)/pedido/[id]/page.tsx).
 */
export async function obtenerPedido(id: string): Promise<PedidoConfirmado | null> {
  if (!UUID.test(id)) return null
  const [p] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      nombre: pedidos.nombre,
      celular: pedidos.celular,
      departamento: pedidos.departamento,
      ciudad: pedidos.ciudad,
      metodoPago: pedidos.metodoPago,
      subtotal: pedidos.subtotal,
      envio: pedidos.envio,
      descuento: pedidos.descuento,
      codigoDescuento: pedidos.codigoDescuento,
      total: pedidos.total,
    })
    .from(pedidos)
    .where(eq(pedidos.id, id))
    .limit(1)
  if (!p) return null

  const items = await db
    .select({
      sku: pedidoItems.sku,
      nombre: pedidoItems.nombre,
      color: pedidoItems.color,
      talla: pedidoItems.talla,
      precio: pedidoItems.precio,
      cantidad: pedidoItems.cantidad,
      imagen: pedidoItems.imagen,
    })
    .from(pedidoItems)
    .where(eq(pedidoItems.pedidoId, id))
    .orderBy(asc(pedidoItems.nombre))

  // El hex no está en la copia del item; se busca aparte para el círculo de
  // color. Si la variante ya no existe, el círculo queda en Sahara.
  const skus = items.map((i) => i.sku)
  const hexes = skus.length
    ? await db
        .select({ sku: variantes.sku, hex: variantes.hex })
        .from(variantes)
        .where(inArray(variantes.sku, skus))
    : []
  const hexPorSku = new Map(hexes.map((h) => [h.sku, h.hex]))

  return { ...p, items: items.map((i) => ({ ...i, hex: hexPorSku.get(i.sku) ?? '' })) }
}
