import { describe, expect, it } from 'vitest'
import { estadoVisible, stockTotal } from './producto-modelo'
import { combinaCon, destacados, listarProductos, obtenerProducto } from './productos'

describe('validacion al leer (segunda capa, sobre la base ya sembrada)', () => {
  it('todo color con imagenes tiene variantes y al reves', async () => {
    const { productos } = await listarProductos()
    for (const p of productos) {
      const enVariantes = new Set(p.variantes.map((v) => v.color))
      expect(new Set(Object.keys(p.imagenes))).toEqual(enVariantes)
    }
  })
})

describe('listarProductos', () => {
  it('devuelve todo el catalogo en el orden del archivo y sin siguiente', async () => {
    const { productos, siguiente } = await listarProductos()
    expect(productos.length).toBe(8)
    expect(productos[0].slug).toBe('legging-duna')
    expect(siguiente).toBeNull()
  })

  it('filtra por categoria', async () => {
    const { productos } = await listarProductos({ categoria: 'leggings' })
    expect(productos.map((p) => p.slug)).toEqual([
      'legging-duna',
      'legging-cauce',
      'legging-medano',
    ])
  })

  it('ordena por precio ascendente y descendente', async () => {
    const asc = await listarProductos({ orden: 'precio-asc' })
    const desc = await listarProductos({ orden: 'precio-desc' })
    expect(asc.productos[0].slug).toBe('top-brisa')
    expect(desc.productos[0].slug).toBe('set-arena')
  })

  it('pagina con limite y cursor', async () => {
    const p1 = await listarProductos({ limite: 6 })
    expect(p1.productos.length).toBe(6)
    // El cursor es opaco (hoy es base64url de {precio, creadoEn}, antes un indice):
    // no se le asume forma, solo que existe cuando hay mas paginas.
    expect(p1.siguiente).not.toBeNull()

    const p2 = await listarProductos({ limite: 6, cursor: p1.siguiente! })
    expect(p2.productos.length).toBe(2)
    expect(p2.siguiente).toBeNull()
    expect(p2.productos[0].slug).toBe('legging-medano')
  })

  it('un cursor invalido se trata como el principio', async () => {
    const { productos } = await listarProductos({ cursor: 'no-es-un-numero' })
    expect(productos.length).toBe(8)
  })

  it('filtra por color, por talla y por rango de precio', async () => {
    const porColor = await listarProductos({ colores: ['Arena'] })
    expect(porColor.productos.map((p) => p.slug).sort()).toEqual([
      'legging-medano',
      'set-arena',
      'top-ocre',
    ])

    // Solo cuenta una talla con stock: XL de Legging Medano esta en 0 en los dos colores
    const porTalla = await listarProductos({ categoria: 'leggings', tallas: ['XL'] })
    expect(porTalla.productos.map((p) => p.slug)).toEqual(['legging-duna', 'legging-cauce'])

    const porPrecio = await listarProductos({ precio: { min: 200000 } })
    expect(porPrecio.productos.map((p) => p.slug)).toEqual(['set-duna', 'set-arena'])
  })

  it('combina filtros con orden', async () => {
    const { productos } = await listarProductos({ categoria: 'tops', orden: 'precio-desc' })
    expect(productos.map((p) => p.slug)).toEqual(['top-umbra', 'top-ocre', 'top-brisa'])
  })
})

describe('obtenerProducto', () => {
  it('devuelve el producto por slug', async () => {
    const p = await obtenerProducto('set-duna')
    expect(p?.nombre).toBe('Set Duna')
  })

  it('devuelve null si el slug no existe', async () => {
    expect(await obtenerProducto('no-existe')).toBeNull()
  })
})

describe('destacados', () => {
  it('devuelve cuatro por defecto y ninguno agotado', async () => {
    const lista = await destacados()
    expect(lista.length).toBe(4)
    for (const p of lista) expect(estadoVisible(p)).not.toBe('agotado')
  })

  it('respeta el limite', async () => {
    expect((await destacados(2)).length).toBe(2)
  })
})

describe('combinaCon', () => {
  it('devuelve los productos de combina_con en su orden', async () => {
    const lista = await combinaCon('legging-duna')
    expect(lista.map((p) => p.slug)).toEqual([
      'top-brisa',
      'top-ocre',
      'set-duna',
      'legging-cauce',
    ])
  })

  it('devuelve lista vacia si el slug no existe', async () => {
    expect(await combinaCon('no-existe')).toEqual([])
  })
})

describe('derivaciones del modelo', () => {
  it('marca agotado el producto sin stock y ultimas el de stock bajo', async () => {
    const umbra = await obtenerProducto('top-umbra')
    const medano = await obtenerProducto('legging-medano')
    expect(stockTotal(umbra!)).toBe(0)
    expect(estadoVisible(umbra!)).toBe('agotado')
    expect(estadoVisible(medano!)).toBe('ultimas')
  })
})
