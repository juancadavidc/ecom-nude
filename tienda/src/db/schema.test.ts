import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from './index'
import { combinaCon, imagenes, productos, variantes } from './schema'

async function crearProductoDePrueba(slug: string) {
  const [fila] = await db
    .insert(productos)
    .values({
      slug,
      nombre: 'Producto de prueba',
      categoria: 'leggings',
      coleccion: 'Prueba',
      precio: 100000,
      descripcion: 'x',
      detalles: [],
      seoTitulo: 'x',
      seoDescripcion: 'x',
      seoAlt: 'x',
    })
    .returning({ id: productos.id })
  return fila.id
}

describe('constraints de la base', () => {
  afterEach(async () => {
    await db.delete(productos).where(eq(productos.slug, 'constraint-test'))
    await db.delete(productos).where(eq(productos.slug, 'constraint-test-2'))
  })

  it('rechaza un slug de producto duplicado', async () => {
    await crearProductoDePrueba('constraint-test')
    await expect(crearProductoDePrueba('constraint-test')).rejects.toThrow()
  })

  it('rechaza una categoria fuera del vocabulario', async () => {
    await expect(
      db.insert(productos).values({
        slug: 'constraint-test-2',
        nombre: 'Producto de prueba',
        // @ts-expect-error — 'invalida' no existe en el enum, es justo lo que se prueba
        categoria: 'invalida',
        coleccion: 'Prueba',
        precio: 100000,
        descripcion: 'x',
        detalles: [],
        seoTitulo: 'x',
        seoDescripcion: 'x',
        seoAlt: 'x',
      }),
    ).rejects.toThrow()
  })

  it('rechaza un SKU de variante duplicado', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await db.insert(variantes).values({ productoId: id, color: 'X', hex: '#000', talla: 'S', sku: 'DUP-SKU', stock: 1 })
    await expect(
      db.insert(variantes).values({ productoId: id, color: 'Y', hex: '#111', talla: 'M', sku: 'DUP-SKU', stock: 1 }),
    ).rejects.toThrow()
  })

  it('rechaza una talla fuera del vocabulario', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await expect(
      db.insert(variantes).values({
        productoId: id,
        color: 'X',
        hex: '#000',
        // @ts-expect-error — XXL no existe en el enum, es justo lo que se prueba
        talla: 'XXL',
        sku: 'TALLA-INVALIDA',
        stock: 1,
      }),
    ).rejects.toThrow()
  })

  it('rechaza una imagen sin producto', async () => {
    await expect(
      db.insert(imagenes).values({ productoId: 'no-existe', color: 'X', ruta: 'x', orden: 0 }),
    ).rejects.toThrow()
  })

  it('rechaza que un producto combine con si mismo', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await expect(db.insert(combinaCon).values({ productoId: id, combinaConId: id, orden: 0 })).rejects.toThrow()
  })

  it('rechaza combina_con hacia un producto que no existe', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await expect(
      db.insert(combinaCon).values({ productoId: id, combinaConId: 'no-existe', orden: 0 }),
    ).rejects.toThrow()
  })
})
