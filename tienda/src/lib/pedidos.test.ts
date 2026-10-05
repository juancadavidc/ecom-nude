import { eq, inArray } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { pedidoItems, pedidos, productos, variantes } from '@/db/schema'
import { CONFIG_POR_DEFECTO, type Config } from './config'
import { MENSAJES } from './pedido-modelo'
import {
  MENSAJE_CARRITO_VACIO,
  MENSAJE_ITEMS,
  PROBLEMAS,
  cotizarItems,
  crearPedido,
  normalizarItems,
  obtenerPedido,
  porcentajeDeCodigo,
} from './pedidos'

/**
 * Corre contra la semilla real (src/content/productos.json):
 *   top-bra                         sku 12-S, $60.000 (precio del producto)
 *   enterizo-corto-tela-fria-siso   Blanco 53-S a $140.000 sobre una base de $135.000
 *   faldita                         borrador: no se vende
 *
 * La config se inyecta: estos tests no dependen de lo que haya en la tabla
 * `config` local (el panel puede haberla cambiado).
 */
const cfg: Config = structuredClone(CONFIG_POR_DEFECTO)

const campos = {
  nombre: 'Prueba Checkout',
  celular: '+57 300 123 4567',
  correo: 'prueba-checkout@nude.test',
  departamento: 'Antioquia',
  ciudad: 'Medellín',
  direccion: 'Calle 10 # 43-21',
  barrio: 'El Poblado',
  indicaciones: 'Portería',
  metodoPago: 'transferencia',
}

const creados: string[] = []

afterEach(async () => {
  if (creados.length) await db.delete(pedidos).where(inArray(pedidos.id, creados.splice(0)))
  // Por si un test que marca una variante como agotada fallo a mitad de camino.
  await db.update(variantes).set({ disponible: true }).where(eq(variantes.sku, '12-M'))
})

async function crear(...args: Parameters<typeof crearPedido>) {
  const r = await crearPedido(...args)
  if (r.ok) creados.push(r.id)
  return r
}

describe('normalizarItems', () => {
  it('une skus repetidos, limita cantidades y descarta basura', () => {
    expect(
      normalizarItems([
        { sku: '12-S', cantidad: 2 },
        { sku: '12-S', cantidad: 3 },
        { sku: '53-S', cantidad: 50 },
        { sku: '', cantidad: 1 },
        { cantidad: 1 },
        'x',
        null,
        { sku: '11-S', cantidad: -4 },
      ]),
    ).toEqual([
      { sku: '12-S', cantidad: 5 },
      { sku: '53-S', cantidad: 10 },
      { sku: '11-S', cantidad: 1 },
    ])
  })

  it('no acepta algo que no sea una lista', () => {
    expect(normalizarItems({ sku: '12-S' })).toEqual([])
  })
})

describe('cotizarItems', () => {
  it('lee el precio de la base, no del cliente', async () => {
    const [l] = await cotizarItems([{ sku: '12-S', cantidad: 1, precio: 1 }])
    expect(l).toMatchObject({ sku: '12-S', productoSlug: 'top-bra', precio: 60000, talla: 'S', problema: null })
    expect(l.imagen).toMatch(/-480\.jpg$/)
    expect(l.hex).toMatch(/^#/)
  })

  it('usa el precio del color cuando lo tiene', async () => {
    const [blanco, azul] = await cotizarItems([
      { sku: '53-S', cantidad: 1 },
      { sku: '52-S', cantidad: 1 },
    ])
    expect(blanco.precio).toBe(140000)
    expect(azul.precio).toBe(135000)
  })

  it('marca lo que no se puede comprar', async () => {
    const lineas = await cotizarItems([
      { sku: 'NO-EXISTE', cantidad: 1 },
      { sku: '44-S', cantidad: 1 },
    ])
    expect(lineas.map((l) => l.problema)).toEqual([PROBLEMAS.noExiste, PROBLEMAS.noALaVenta])
  })
})

describe('crearPedido', () => {
  it('guarda pedido e items con precios de la base y envio metro', async () => {
    const r = await crear(
      {
        campos,
        items: [
          { sku: '12-S', cantidad: 2, precio: 100 },
          { sku: '53-S', cantidad: 1, precio: 100 },
        ],
      },
      { config: cfg },
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const [p] = await db.select().from(pedidos).where(eq(pedidos.id, r.id))
    expect(p).toMatchObject({
      estado: 'nuevo',
      nombre: 'Prueba Checkout',
      celular: '3001234567',
      ciudad: 'Medellín',
      metodoPago: 'transferencia',
      subtotal: 2 * 60000 + 140000,
      envio: 14000,
      descuento: 0,
      codigoDescuento: null,
      total: 260000 + 14000,
    })
    expect(r.total).toBe(274000)
    expect(r.numero).toBe(p.numero)

    const items = await db.select().from(pedidoItems).where(eq(pedidoItems.pedidoId, r.id))
    expect(items).toHaveLength(2)
    const top = items.find((i) => i.sku === '12-S')!
    expect(top).toMatchObject({ productoSlug: 'top-bra', talla: 'S', precio: 60000, cantidad: 2 })
    expect(top.nombre).not.toBe('')
    expect(top.color).not.toBe('')
    expect(top.imagen).toMatch(/-480\.jpg$/)
  })

  it('cobra envio nacional fuera del area metropolitana', async () => {
    const r = await crear(
      { campos: { ...campos, departamento: 'Valle del Cauca', ciudad: 'Cali' }, items: [{ sku: '12-S', cantidad: 1 }] },
      { config: cfg },
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const [p] = await db.select().from(pedidos).where(eq(pedidos.id, r.id))
    expect(p.envio).toBe(20000)
    expect(p.total).toBe(80000)
  })

  it('aplica el codigo de descuento sobre el subtotal, no sobre el envio', async () => {
    const r = await crear(
      { campos, items: [{ sku: '12-S', cantidad: 2 }], codigo: ' secondskin ' },
      { config: cfg },
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const [p] = await db.select().from(pedidos).where(eq(pedidos.id, r.id))
    expect(p).toMatchObject({ subtotal: 120000, descuento: 12000, codigoDescuento: 'SECONDSKIN', envio: 14000 })
    expect(p.total).toBe(122000)
  })

  it('rechaza un codigo que no existe o esta apagado', async () => {
    const apagado: Config = {
      ...cfg,
      codigosDescuento: [{ codigo: 'SECONDSKIN', porcentaje: 10, activo: false }],
    }
    const r = await crear({ campos, items: [{ sku: '12-S', cantidad: 1 }], codigo: 'SECONDSKIN' }, { config: apagado })
    expect(r).toMatchObject({ ok: false, errores: { codigo: MENSAJES.codigoInvalido } })
    expect(porcentajeDeCodigo('INVENTADO', cfg)).toBeNull()
    expect(porcentajeDeCodigo('secondskin', cfg)).toBe(10)
  })

  it('rechaza un borrador, un sku inexistente y una variante agotada, linea por linea', async () => {
    await db.update(variantes).set({ disponible: false }).where(eq(variantes.sku, '12-M'))
    const antes = await db.select({ id: pedidos.id }).from(pedidos)
    const r = await crear(
      {
        campos,
        items: [
          { sku: '12-S', cantidad: 1 },
          { sku: '12-M', cantidad: 1 },
          { sku: '44-S', cantidad: 1 },
          { sku: 'NO-EXISTE', cantidad: 1 },
        ],
      },
      { config: cfg },
    )
    expect(r).toEqual({
      ok: false,
      errores: {},
      mensaje: MENSAJE_ITEMS,
      erroresItems: {
        '12-M': PROBLEMAS.agotado,
        '44-S': PROBLEMAS.noALaVenta,
        'NO-EXISTE': PROBLEMAS.noExiste,
      },
    })
    expect(await db.select({ id: pedidos.id }).from(pedidos)).toHaveLength(antes.length)
  })

  it('rechaza un producto agotado aunque la variante diga disponible', async () => {
    await db.update(productos).set({ estado: 'agotado' }).where(eq(productos.slug, 'top-bra'))
    try {
      const r = await crear({ campos, items: [{ sku: '12-S', cantidad: 1 }] }, { config: cfg })
      expect(r).toMatchObject({ ok: false, erroresItems: { '12-S': PROBLEMAS.agotado } })
    } finally {
      await db.update(productos).set({ estado: 'activo' }).where(eq(productos.slug, 'top-bra'))
    }
  })

  it('devuelve los errores de campo sin guardar nada', async () => {
    const r = await crear(
      { campos: { ...campos, celular: '604 123 4567', ciudad: 'Cali' }, items: [{ sku: '12-S', cantidad: 1 }] },
      { config: cfg },
    )
    expect(r).toMatchObject({
      ok: false,
      errores: { celular: MENSAJES.celularInvalido, ciudad: MENSAJES.ciudadInvalida },
      mensaje: null,
    })
  })

  it('no crea un pedido sin items', async () => {
    const r = await crear({ campos, items: [] }, { config: cfg })
    expect(r).toMatchObject({ ok: false, mensaje: MENSAJE_CARRITO_VACIO })
  })

  it('limita la cantidad por linea', async () => {
    const r = await crear({ campos, items: [{ sku: '12-S', cantidad: 500 }] }, { config: cfg })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const [i] = await db.select().from(pedidoItems).where(eq(pedidoItems.pedidoId, r.id))
    expect(i.cantidad).toBe(10)
  })
})

describe('obtenerPedido', () => {
  it('devuelve lo justo para la confirmacion', async () => {
    const r = await crear({ campos, items: [{ sku: '53-S', cantidad: 1 }] }, { config: cfg })
    if (!r.ok) throw new Error('no se creo el pedido')
    const p = await obtenerPedido(r.id)
    expect(p).toMatchObject({ numero: r.numero, ciudad: 'Medellín', total: 154000 })
    expect(p).not.toHaveProperty('direccion')
    expect(p).not.toHaveProperty('correo')
    expect(p!.items[0]).toMatchObject({ sku: '53-S', precio: 140000, hex: expect.stringMatching(/^#/) })
  })

  it('null para un id que no existe o no tiene forma de id', async () => {
    expect(await obtenerPedido('00000000-0000-4000-8000-000000000000')).toBeNull()
    expect(await obtenerPedido("1' or '1'='1")).toBeNull()
  })
})
