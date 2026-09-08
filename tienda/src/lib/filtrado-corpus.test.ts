import { describe, expect, it } from 'vitest'
import { aplicarFiltros, type FiltrosActivos } from './filtros'
import { listarProductos } from './productos'
import type { Talla } from './producto-modelo'

/**
 * Mitigacion del riesgo "dos implementaciones de la misma regla de filtrado"
 * (spec §8): la ruta JS (`aplicarFiltros`, mejora progresiva en el cliente) y la
 * ruta SQL (`listarProductos`, usada por el panel futuro) tienen que devolver el
 * mismo catalogo para los mismos filtros. Si alguien cambia una y no la otra, un
 * caso de este corpus falla con nombre y linea.
 */
const CASOS: { nombre: string; filtros: FiltrosActivos }[] = [
  { nombre: 'sin filtros', filtros: { colores: [], tallas: [], precio: {}, orden: 'novedad' } },
  { nombre: 'un color', filtros: { colores: ['Duna'], tallas: [], precio: {}, orden: 'novedad' } },
  { nombre: 'una talla, precio ascendente', filtros: { colores: [], tallas: ['XL' as Talla], precio: {}, orden: 'precio-asc' } },
  {
    nombre: 'color y talla cruzados, precio descendente',
    filtros: { colores: ['Arena'], tallas: ['S' as Talla], precio: {}, orden: 'precio-desc' },
  },
  { nombre: 'precio minimo', filtros: { colores: [], tallas: [], precio: { min: 100000 }, orden: 'novedad' } },
  { nombre: 'precio maximo, precio ascendente', filtros: { colores: [], tallas: [], precio: { max: 150000 }, orden: 'precio-asc' } },
  {
    nombre: 'colores, tallas y rango de precio combinados',
    filtros: {
      colores: ['Umbra', 'Duna'],
      tallas: ['M', 'L'] as Talla[],
      precio: { min: 90000, max: 230000 },
      orden: 'precio-desc',
    },
  },
]

describe('corpus compartido de filtrado: JS y SQL dan el mismo resultado', () => {
  it.each(CASOS.map((c) => [c.nombre, c.filtros] as const))('%s', async (_nombre, filtros) => {
    const { productos: catalogoCompleto } = await listarProductos()
    const esperado = aplicarFiltros(catalogoCompleto, filtros).map((p) => p.slug)

    const { productos: obtenidos } = await listarProductos({
      colores: filtros.colores,
      tallas: filtros.tallas,
      precio: filtros.precio,
      orden: filtros.orden,
    })

    expect(obtenidos.map((p) => p.slug)).toEqual(esperado)
  })
})
