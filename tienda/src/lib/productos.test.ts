import { describe, expect, it } from 'vitest'
import type { Producto } from './producto-modelo'
import { estadoVisible, precioDe, rangoPrecio } from './producto-modelo'
import {
  combinaCon,
  destacados,
  listarCategorias,
  listarProductos,
  obtenerCategoria,
  obtenerProducto,
} from './productos'

/**
 * Corre contra la semilla real (src/content/productos.json): 46 productos, 32
 * publicados y 14 en borrador porque todavia no tienen foto.
 */

describe('validacion al leer (segunda capa, sobre la base ya sembrada)', () => {
  it('todo color con imagenes tiene variantes', async () => {
    const { productos } = await listarProductos({ incluirBorradores: true })
    for (const p of productos) {
      const enVariantes = new Set(p.variantes.map((v) => v.color))
      for (const color of Object.keys(p.imagenes)) expect(enVariantes).toContain(color)
    }
  })
})

describe('listarProductos', () => {
  it('devuelve lo publicado en el orden del archivo y sin siguiente', async () => {
    const { productos, siguiente } = await listarProductos()
    expect(productos.length).toBe(32)
    expect(productos[0].slug).toBe('enterizo-corto-tela-fria-manga-larga')
    expect(siguiente).toBeNull()
  })

  it('nunca muestra borradores en la tienda, si en el panel', async () => {
    const tienda = await listarProductos()
    expect(tienda.productos.some((p) => p.estado === 'borrador')).toBe(false)
    const panel = await listarProductos({ incluirBorradores: true })
    expect(panel.productos.length).toBe(46)
  })

  it('filtra por categoria', async () => {
    const { productos } = await listarProductos({ categoria: 'leggings' })
    expect(productos.map((p) => p.slug)).toEqual([
      'legging-mesh',
      'legging-rib-sin-push',
      'legging-rib-push',
      'legging-koko',
    ])
  })

  it('ordena por precio ascendente y descendente', async () => {
    const asc = await listarProductos({ orden: 'precio-asc' })
    const desc = await listarProductos({ orden: 'precio-desc' })
    expect(asc.productos[0].slug).toBe('calentadoras-small')
    expect(desc.productos[0].slug).toBe('set-halo')
  })

  it('pagina con limite y cursor', async () => {
    const p1 = await listarProductos({ limite: 30 })
    expect(p1.productos.length).toBe(30)
    // El cursor es opaco: no se le asume forma, solo que existe cuando hay mas.
    expect(p1.siguiente).not.toBeNull()

    const p2 = await listarProductos({ limite: 30, cursor: p1.siguiente! })
    expect(p2.productos.length).toBe(2)
    expect(p2.siguiente).toBeNull()
  })

  it('un cursor invalido se trata como el principio', async () => {
    const { productos } = await listarProductos({ cursor: 'no-es-un-cursor' })
    expect(productos.length).toBe(32)
  })

  it('filtra por color, por talla y por rango de precio', async () => {
    const porColor = await listarProductos({ colores: ['Chocolate'] })
    expect(porColor.productos.map((p) => p.slug)).toEqual(['legging-rib-push', 'top-premium'])

    const porTalla = await listarProductos({ tallas: ['U'] })
    expect(porTalla.productos.map((p) => p.slug)).toEqual([
      'manguitas',
      'calentadoras-classic',
      'calentadoras-small',
      'shot-de-curcuma',
    ])

    const porPrecio = await listarProductos({ precio: { min: 160000 } })
    expect(porPrecio.productos.map((p) => p.slug)).toEqual([
      'enterizo-largo-tela-fria-manga-larga',
      'enterizo-halter-sin-costuras',
      'set-halo',
      'body-mesh-manga-larga',
    ])
  })

  it('combina filtros con orden', async () => {
    const { productos } = await listarProductos({ categoria: 'tops', orden: 'precio-desc' })
    expect(productos[0].slug).toBe('blusita-mesh-con-top')
    expect(productos.at(-1)!.slug).toBe('top-bra')
  })
})

describe('obtenerProducto', () => {
  it('devuelve el producto por slug con el nombre de su categoria', async () => {
    const p = await obtenerProducto('set-halo')
    expect(p?.nombre).toBe('Set Halo')
    expect(p?.categoriaNombre).toBe('Sets')
  })

  it('devuelve null si el slug no existe', async () => {
    expect(await obtenerProducto('no-existe')).toBeNull()
  })

  it('un borrador no existe para la tienda, si para el panel', async () => {
    expect(await obtenerProducto('faldita')).toBeNull()
    expect((await obtenerProducto('faldita', { incluirBorradores: true }))?.estado).toBe('borrador')
  })
})

describe('destacados', () => {
  it('pone primero los marcados en el panel y ninguno agotado', async () => {
    const lista = await destacados(4)
    expect(lista.length).toBe(4)
    for (const p of lista) {
      expect(p.destacado).toBe(true)
      expect(estadoVisible(p)).not.toBe('agotado')
    }
  })

  it('respeta el limite', async () => {
    expect((await destacados(2)).length).toBe(2)
  })
})

describe('combinaCon', () => {
  it('devuelve los productos de combina_con en su orden', async () => {
    const lista = await combinaCon('legging-mesh')
    expect(lista.map((p) => p.slug)).toEqual(['body-mesh-manga-larga', 'blusita-mesh-con-top', 'top-bra'])
  })

  it('devuelve lista vacia si el slug no existe', async () => {
    expect(await combinaCon('no-existe')).toEqual([])
  })
})

describe('categorias', () => {
  it('lista solo las que tienen algo publicado cuando se pide', async () => {
    const todas = await listarCategorias()
    const conProductos = await listarCategorias({ conProductos: true })
    expect(todas.map((c) => c.slug)[0]).toBe('enterizos')
    expect(conProductos.every((c) => c.cantidad > 0)).toBe(true)
    // Bienestar tiene un solo producto y esta publicado
    expect(conProductos.find((c) => c.slug === 'bienestar')?.cantidad).toBe(1)
  })

  it('obtiene una categoria por slug', async () => {
    expect((await obtenerCategoria('enterizos'))?.nombre).toBe('Enterizos')
    expect(await obtenerCategoria('no-existe')).toBeNull()
  })
})

describe('derivaciones del modelo', () => {
  it('un color puede costar distinto que el producto', async () => {
    const p = (await obtenerProducto('enterizo-corto-tela-fria-siso'))!
    expect(precioDe(p, 'Gris')).toBe(135000)
    expect(precioDe(p, 'Blanco')).toBe(140000)
    expect(rangoPrecio(p)).toEqual({ min: 135000, max: 140000 })
  })

  it('agotado cuando se marca a mano o cuando ninguna variante esta disponible', async () => {
    const p = (await obtenerProducto('top-bra'))!
    expect(estadoVisible(p)).toBe('activo')
    const sinNada: Producto = { ...p, variantes: p.variantes.map((v) => ({ ...v, disponible: false })) }
    expect(estadoVisible(sinNada)).toBe('agotado')
    expect(estadoVisible({ ...p, estado: 'agotado' })).toBe('agotado')
  })
})
