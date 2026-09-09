import type { Orden, Producto, Talla } from './producto-modelo'
import { TALLAS, coloresDe } from './producto-modelo'

/**
 * Filtros del catalogo: leerlos de la URL, escribirlos a la URL y aplicarlos a
 * una lista. Todo puro — no toca `window`, no toca React.
 *
 * Los filtros viven en la URL a proposito (criterio de aceptacion): un filtro
 * se puede compartir por WhatsApp y el boton atras funciona. Si vivieran en
 * `useState` las dos cosas se pierden.
 *
 * Se importan tipos de `producto-modelo` con `import type` donde se puede para
 * no crear un ciclo en tiempo de ejecucion con `productos.ts`, que si importa
 * valores de aqui.
 */

export type FiltrosActivos = {
  colores: string[]
  tallas: Talla[]
  precio: { min?: number; max?: number }
  orden: Orden
}

export const FILTROS_VACIOS: FiltrosActivos = {
  colores: [],
  tallas: [],
  precio: {},
  orden: 'novedad',
}

export type OpcionesFiltro = {
  colores: { nombre: string; hex: string }[]
  tallas: Talla[]
  precio: { min: number; max: number }
}

const ORDENES: readonly Orden[] = ['novedad', 'precio-asc', 'precio-desc']

/** `ReadonlyURLSearchParams` de Next expone la misma superficie que se usa aqui. */
type Params = Pick<URLSearchParams, 'get'>

function lista(params: Params, clave: string): string[] {
  const crudo = params.get(clave)
  if (!crudo) return []
  return crudo
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function numero(params: Params, clave: string): number | undefined {
  const n = Number(params.get(clave))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function leerFiltros(params: Params): FiltrosActivos {
  const orden = params.get('orden')
  const min = numero(params, 'min')
  const max = numero(params, 'max')

  return {
    colores: lista(params, 'color'),
    // Una talla que no existe en el vocabulario es una URL de otra version del
    // sitio o escrita a mano. Se descarta en vez de dejar la grilla vacia.
    tallas: lista(params, 'talla').filter((t): t is Talla =>
      (TALLAS as readonly string[]).includes(t),
    ),
    precio: { ...(min != null && { min }), ...(max != null && { max }) },
    orden: ORDENES.includes(orden as Orden) ? (orden as Orden) : 'novedad',
  }
}

/** Devuelve el query string sin `?`. Lo que esta en su valor por defecto no se escribe. */
export function escribirFiltros(f: FiltrosActivos): string {
  const params = new URLSearchParams()
  if (f.colores.length) params.set('color', f.colores.join(','))
  if (f.tallas.length) params.set('talla', f.tallas.join(','))
  if (f.precio.min != null) params.set('min', String(f.precio.min))
  if (f.precio.max != null) params.set('max', String(f.precio.max))
  if (f.orden !== 'novedad') params.set('orden', f.orden)
  return params.toString()
}

/**
 * Color y talla se cruzan sobre la MISMA variante y solo cuentan si tiene stock:
 * pedir "Duna" y "XL" tiene que devolver lo que existe en Duna talla XL, no lo
 * que existe en Duna por un lado y en XL por otro.
 */
function pasaVariantes(p: Producto, f: FiltrosActivos): boolean {
  if (!f.colores.length && !f.tallas.length) return true
  return p.variantes.some(
    (v) =>
      v.stock > 0 &&
      (!f.colores.length || f.colores.includes(v.color)) &&
      (!f.tallas.length || f.tallas.includes(v.talla)),
  )
}

/**
 * `novedad` es el orden del archivo: mas nuevo primero. No hay campo de fecha
 * porque no hay nada que lo alimente todavia — anadirlo ahora seria un dato que
 * alguien tendria que mantener a mano sin usarlo.
 * TODO(fase-2): ordenar por `creado` cuando Firestore lo tenga.
 */
export function aplicarFiltros(productos: Producto[], f: FiltrosActivos): Producto[] {
  const filtrados = productos.filter(
    (p) =>
      pasaVariantes(p, f) &&
      (f.precio.min == null || p.precio >= f.precio.min) &&
      (f.precio.max == null || p.precio <= f.precio.max),
  )

  if (f.orden === 'novedad') return filtrados
  const signo = f.orden === 'precio-asc' ? 1 : -1
  return [...filtrados].sort((a, b) => signo * (a.precio - b.precio))
}

/** Lo que la barra de filtros puede ofrecer, sacado del catalogo real. */
export function opcionesDe(productos: Producto[]): OpcionesFiltro {
  const colores = new Map<string, string>()
  const tallas = new Set<Talla>()
  let min = Infinity
  let max = 0

  for (const p of productos) {
    for (const c of coloresDe(p)) if (!colores.has(c.nombre)) colores.set(c.nombre, c.hex)
    for (const v of p.variantes) tallas.add(v.talla)
    min = Math.min(min, p.precio)
    max = Math.max(max, p.precio)
  }

  return {
    colores: [...colores].map(([nombre, hex]) => ({ nombre, hex })),
    tallas: TALLAS.filter((t) => tallas.has(t)),
    precio: { min: Number.isFinite(min) ? min : 0, max },
  }
}

/** Para el contador del boton "Filtrar" en movil. El orden no es un filtro. */
export function cuantosActivos(f: FiltrosActivos): number {
  return (
    f.colores.length +
    f.tallas.length +
    (f.precio.min != null ? 1 : 0) +
    (f.precio.max != null ? 1 : 0)
  )
}
