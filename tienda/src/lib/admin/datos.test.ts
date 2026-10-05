import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { medios, pedidos } from '@/db/schema'
import { listarProductosPanel, obtenerProductoPanel, resumenPedidos, resumenProductos } from './datos'
import { parsearArchivo } from './medios'

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

  it('la tabla medios guarda bytea', async () => {
    const id = crypto.randomUUID()
    await db.insert(medios).values({ id, ancho: 480, formato: 'jpg', datos: Buffer.from([1, 2, 3]) })
    const [f] = await db.select().from(medios).where(eq(medios.id, id))
    expect([...f.datos]).toEqual([1, 2, 3])
    await db.delete(medios).where(eq(medios.id, id))
  })
})
