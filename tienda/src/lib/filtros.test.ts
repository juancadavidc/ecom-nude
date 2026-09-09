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
    const lista = aplicarFiltros(await todos(), { ...FILTROS_VACIOS, colores: ['Umbra'] })
    expect(lista.map((p) => p.slug).sort()).toEqual(['legging-cauce', 'top-ocre'])
  })

  it('solo cuenta la talla si esa variante tiene stock', async () => {
    const lista = aplicarFiltros(await todos(), { ...FILTROS_VACIOS, tallas: ['XL'] })
    expect(lista.map((p) => p.slug)).not.toContain('legging-medano')
    expect(lista.map((p) => p.slug)).not.toContain('top-umbra')
  })

  it('cruza color y talla sobre la misma variante', async () => {
    // Legging Medano solo tiene stock en Duna S/M y Arena S/M
    const lista = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      colores: ['Duna'],
      tallas: ['S'],
    })
    expect(lista.map((p) => p.slug)).toContain('legging-medano')

    const vacia = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      colores: ['Duna'],
      tallas: ['XL'],
    })
    expect(vacia.map((p) => p.slug)).not.toContain('legging-medano')
  })

  it('filtra por rango de precio', async () => {
    const lista = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      precio: { min: 100000, max: 150000 },
    })
    expect(lista.map((p) => p.slug).sort()).toEqual([
      'legging-duna',
      'legging-medano',
      'top-ocre',
      'top-umbra',
    ])
  })

  it('ordena sin mutar la lista original', async () => {
    const lista = await todos()
    const copia = [...lista]
    const ordenada = aplicarFiltros(lista, { ...FILTROS_VACIOS, orden: 'precio-asc' })
    expect(ordenada[0].slug).toBe('top-brisa')
    expect(lista).toEqual(copia)
  })
})

describe('opcionesDe', () => {
  it('reune colores sin repetir y tallas en el orden de la etiqueta', async () => {
    const o = opcionesDe(await todos())
    expect(o.colores.map((c) => c.nombre).sort()).toEqual([
      'Arena',
      'Duna',
      'Negro Humo',
      'Umbra',
    ])
    expect(o.tallas).toEqual(['XS', 'S', 'M', 'L', 'XL'])
    expect(o.precio).toEqual({ min: 98000, max: 239000 })
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
