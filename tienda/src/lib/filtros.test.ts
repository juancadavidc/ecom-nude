import { describe, expect, it } from 'vitest'
import type { Producto, Talla } from './producto-modelo'
import {
  FILTROS_VACIOS,
  aplicarFiltros,
  cuantosActivos,
  escribirFiltros,
  leerFiltros,
  opcionesDe,
} from './filtros'
import { listarProductos } from './productos'

async function todos(): Promise<Producto[]> {
  return (await listarProductos()).productos
}

describe('leerFiltros', () => {
  it('sin parametros devuelve los filtros vacios', () => {
    expect(leerFiltros(new URLSearchParams())).toEqual(FILTROS_VACIOS)
  })

  it('lee colores y tallas separados por coma', () => {
    const f = leerFiltros(new URLSearchParams('color=Duna,Arena&talla=S,M'))
    expect(f.colores).toEqual(['Duna', 'Arena'])
    expect(f.tallas).toEqual(['S', 'M'])
  })

  it('descarta tallas que no existen', () => {
    expect(leerFiltros(new URLSearchParams('talla=S,XXL')).tallas).toEqual(['S'])
  })

  it('lee el rango de precio y descarta lo que no es numero', () => {
    expect(leerFiltros(new URLSearchParams('min=100000&max=abc')).precio).toEqual({
      min: 100000,
    })
  })

  it('cae a novedad si el orden no es uno de los tres', () => {
    expect(leerFiltros(new URLSearchParams('orden=lo-que-sea')).orden).toBe('novedad')
    expect(leerFiltros(new URLSearchParams('orden=precio-desc')).orden).toBe('precio-desc')
  })
})

describe('escribirFiltros', () => {
  it('no escribe nada cuando no hay filtros', () => {
    expect(escribirFiltros(FILTROS_VACIOS)).toBe('')
  })

  it('omite el orden por defecto', () => {
    expect(escribirFiltros({ ...FILTROS_VACIOS, colores: ['Duna'] })).toBe('color=Duna')
  })

  it('es el inverso de leerFiltros', () => {
    const original = {
      colores: ['Duna', 'Arena'],
      tallas: ['S', 'M'] as Talla[],
      precio: { min: 100000, max: 200000 },
      orden: 'precio-asc' as const,
    }
    expect(leerFiltros(new URLSearchParams(escribirFiltros(original)))).toEqual(original)
  })
})

describe('aplicarFiltros', () => {
  it('sin filtros devuelve la lista tal cual', async () => {
    const lista = await todos()
    expect(aplicarFiltros(lista, FILTROS_VACIOS)).toEqual(lista)
  })

  it('filtra por color', async () => {
    const lista = aplicarFiltros(await todos(), { ...FILTROS_VACIOS, colores: ['Chocolate'] })
    expect(lista.map((p) => p.slug)).toEqual(['legging-rib-push', 'top-premium'])
  })

  it('solo cuenta la talla si esa variante esta disponible', async () => {
    const lista = await todos()
    const bra = lista.find((p) => p.slug === 'top-bra')!
    const sinS = { ...bra, variantes: bra.variantes.map((v) => (v.talla === 'S' ? { ...v, disponible: false } : v)) }
    const filtrada = aplicarFiltros([sinS], { ...FILTROS_VACIOS, tallas: ['S'] })
    expect(filtrada).toEqual([])
  })

  it('cruza color y talla sobre la misma variante', async () => {
    const lista = await todos()
    const bra = lista.find((p) => p.slug === 'top-bra')!
    // Gris S agotado, Blanco S disponible: pedir Gris + S no debe pasar
    const mixto = {
      ...bra,
      variantes: bra.variantes.map((v) => (v.color === 'Gris' && v.talla === 'S' ? { ...v, disponible: false } : v)),
    }
    expect(aplicarFiltros([mixto], { ...FILTROS_VACIOS, colores: ['Gris'], tallas: ['S'] })).toEqual([])
    expect(aplicarFiltros([mixto], { ...FILTROS_VACIOS, colores: ['Blanco'], tallas: ['S'] })).toHaveLength(1)
  })

  it('filtra por rango de precio', async () => {
    const lista = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      precio: { min: 160000 },
    })
    expect(lista.map((p) => p.slug)).toEqual([
      'enterizo-largo-tela-fria-manga-larga',
      'enterizo-halter-sin-costuras',
      'set-halo',
      'body-mesh-manga-larga',
    ])
  })

  it('ordena sin mutar la lista original', async () => {
    const lista = await todos()
    const copia = [...lista]
    const ordenada = aplicarFiltros(lista, { ...FILTROS_VACIOS, orden: 'precio-asc' })
    expect(ordenada[0].slug).toBe('calentadoras-small')
    expect(lista).toEqual(copia)
  })
})

describe('opcionesDe', () => {
  it('reune colores sin repetir, tallas en el orden de la etiqueta y el rango por color', async () => {
    const o = opcionesDe(await todos())
    const nombres = o.colores.map((c) => c.nombre)
    expect(new Set(nombres).size).toBe(nombres.length)
    expect(nombres).toContain('Chocolate')
    expect(o.tallas).toEqual(['S', 'M', 'L', 'U'])
    expect(o.precio).toEqual({ min: 36000, max: 185000 })
  })
})

describe('cuantosActivos', () => {
  it('cuenta cada dimension una vez y no cuenta el orden', () => {
    expect(cuantosActivos(FILTROS_VACIOS)).toBe(0)
    expect(cuantosActivos({ ...FILTROS_VACIOS, orden: 'precio-asc' })).toBe(0)
    expect(
      cuantosActivos({
        colores: ['Duna', 'Arena'],
        tallas: ['S'],
        precio: { min: 100000 },
        orden: 'novedad',
      }),
    ).toBe(4)
  })
})
