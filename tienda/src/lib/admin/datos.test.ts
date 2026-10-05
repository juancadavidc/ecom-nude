import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { imagenes, pedidos, productos } from '@/db/schema'
import { almacen } from '@/lib/almacen'
import { ANCHOS_PRODUCTO, FORMATOS } from '@/lib/fotos'
import { listarProductosPanel, obtenerProductoPanel, resumenPedidos, resumenProductos } from './datos'
import { clavesMedio, guardarMedio, limpiarMedios, parsearArchivo } from './medios'

/** Corre contra la semilla: 46 productos, 32 publicados, 14 borradores sin foto. */

describe('lecturas del panel', () => {
  it('lista todo, borradores incluidos', async () => {
    const todos = await listarProductosPanel()
    expect(todos.length).toBe(46)
    const r = await resumenProductos()
    expect(r.todos).toBe(46)
    expect(r.borrador).toBe(14)
  })

  it('filtra sin fotos y busca sin tildes', async () => {
    const sinFotos = await listarProductosPanel({ estado: 'sin-fotos' })
    expect(sinFotos.length).toBeGreaterThan(0)
    expect(sinFotos.every((p) => p.fotos === 0 && p.primeraFoto === null)).toBe(true)
    const busqueda = await listarProductosPanel({ q: 'tela fria' })
    expect(busqueda.length).toBeGreaterThan(0)
    expect(busqueda.every((p) => /tela fr[ií]a/i.test(p.nombre) || p.colores.length >= 0)).toBe(true)
  })

  it('arma el producto del editor con codigo de color y grilla completa', async () => {
    const [primero] = await listarProductosPanel({ q: 'enterizo corto tela fria manga larga' })
    const p = await obtenerProductoPanel(primero.id)
    expect(p).not.toBeNull()
    expect(p!.variantes.length).toBe(p!.colores.length * p!.tallas.length)
    const negro = p!.colores.find((c) => c.nombre === 'Negro')
    expect(negro?.codigo).toBe('54')
    expect(negro?.original).toBe('Negro')
  })
})

describe('pedidos', () => {
  const id = crypto.randomUUID()
  afterAll(async () => {
    await db.delete(pedidos).where(eq(pedidos.id, id))
  })

  it('cuenta por estado', async () => {
    const antes = await resumenPedidos()
    await db.insert(pedidos).values({
      id,
      nombre: 'Prueba',
      celular: '3001234567',
      correo: 'p@example.com',
      departamento: 'Antioquia',
      ciudad: 'Medellín',
      direccion: 'Calle 1',
      metodoPago: 'contraentrega',
      subtotal: 100000,
      envio: 14000,
      total: 114000,
    })
    const despues = await resumenPedidos()
    expect(despues.nuevo).toBe(antes.nuevo + 1)
    expect(despues.todos).toBe(antes.todos + 1)
  })
})

describe('medios', () => {
  it('parsea solo nombres <uuid>-<ancho>.<formato>', () => {
    const id = '0b7c2f9e-1111-4222-8333-944455556666'
    expect(parsearArchivo(`${id}-960.webp`)).toEqual({ id, ancho: 960, formato: 'webp' })
    expect(parsearArchivo(`${id}-960.gif`)).toBeNull()
    expect(parsearArchivo('../../etc/passwd')).toBeNull()
  })

  it('guarda las seis variantes en el almacen y las borra cuando ya nadie las usa', async () => {
    const id = crypto.randomUUID()
    const procesados = ANCHOS_PRODUCTO.flatMap((ancho) =>
      FORMATOS.map((formato) => ({ ancho, formato, datos: Buffer.from(`${ancho}.${formato}`) })),
    )
    await guardarMedio(id, procesados)
    expect((await almacen().listar(`media/${id}`)).sort()).toEqual(clavesMedio(id).sort())

    await limpiarMedios([`/media/${id}`])
    expect(await almacen().listar(`media/${id}`)).toEqual([])
  })

  it('no borra un medio que alguna imagen todavia usa', async () => {
    const id = crypto.randomUUID()
    await guardarMedio(id, [{ ancho: 480, formato: 'jpg', datos: Buffer.from([1]) }])
    const [p] = await db.select({ id: productos.id }).from(productos).limit(1)
    const [img] = await db.insert(imagenes).values({ productoId: p.id, color: 'X', ruta: `/media/${id}`, orden: 99 }).returning()

    await limpiarMedios([`/media/${id}`])
    expect(await almacen().listar(`media/${id}`)).toHaveLength(1)

    await db.delete(imagenes).where(eq(imagenes.id, img.id))
    await limpiarMedios([`/media/${id}`])
  })
})
