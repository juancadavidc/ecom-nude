import archivo from '@/content/productos.json'
import type { Categoria, Orden, Producto, Talla } from './producto-modelo'
import { estadoVisible } from './producto-modelo'

/**
 * EL ADAPTADOR. Unico modulo del sitio que importa `productos.json`.
 *
 * Las cuatro funciones son `async` aunque hoy lean un archivo sincrono. Es la
 * decision que hace que la fase 2 no duela: cuando el catalogo pase a Firestore
 * (SPEC §9.2) cambia el cuerpo de estas cuatro funciones y ningun componente se
 * toca. Si alguna fuera sincrona, cada pagina que la llama tendria que cambiar.
 *
 * TODO(fase-2): reemplazar el import por consultas a la coleccion `productos`.
 * El tipo `Producto` es el contrato que debe devolver ese documento.
 */

const catalogo = archivo.productos as unknown as Producto[]

export type OpcionesListado = {
  categoria?: Categoria
  /** Nombres de color, tal como los ve la clienta. */
  colores?: string[]
  tallas?: Talla[]
  precio?: { min?: number; max?: number }
  orden?: Orden
  /** Opaco. Hoy es el indice del siguiente elemento; en Firestore sera otro. */
  cursor?: string
  /** Sin limite, devuelve todo lo que queda desde el cursor. */
  limite?: number
}

/** Un producto pasa el filtro de color/talla solo si esa variante tiene stock. */
function pasaVariantes(p: Producto, colores?: string[], tallas?: Talla[]): boolean {
  if (!colores?.length && !tallas?.length) return true
  return p.variantes.some(
    (v) =>
      v.stock > 0 &&
      (!colores?.length || colores.includes(v.color)) &&
      (!tallas?.length || tallas.includes(v.talla)),
  )
}

function pasaPrecio(p: Producto, precio?: { min?: number; max?: number }): boolean {
  if (precio?.min != null && p.precio < precio.min) return false
  if (precio?.max != null && p.precio > precio.max) return false
  return true
}

/**
 * `novedad` es el orden del archivo: mas nuevo primero. No hay campo de fecha
 * porque no hay nada que lo alimente todavia — anadirlo ahora seria un dato que
 * alguien tendria que mantener a mano sin usarlo.
 * TODO(fase-2): ordenar por `creado` cuando Firestore lo tenga.
 */
function ordenar(lista: Producto[], orden: Orden = 'novedad'): Producto[] {
  if (orden === 'novedad') return lista
  const signo = orden === 'precio-asc' ? 1 : -1
  return [...lista].sort((a, b) => signo * (a.precio - b.precio))
}

export async function listarProductos(
  opts: OpcionesListado = {},
): Promise<{ productos: Producto[]; siguiente: string | null }> {
  const { categoria, colores, tallas, precio, orden, cursor, limite } = opts

  const filtrados = ordenar(
    catalogo.filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        pasaVariantes(p, colores, tallas) &&
        pasaPrecio(p, precio),
    ),
    orden,
  )

  // Un cursor que no se entiende es un cursor de otra version del sitio. Se
  // empieza por el principio en vez de devolver vacio: un catalogo en blanco es
  // peor que un catalogo repetido.
  const desde = Number.parseInt(cursor ?? '', 10)
  const inicio = Number.isInteger(desde) && desde > 0 ? desde : 0
  const hasta = limite == null ? filtrados.length : inicio + limite
  const pagina = filtrados.slice(inicio, hasta)

  return {
    productos: pagina,
    siguiente: hasta < filtrados.length ? String(hasta) : null,
  }
}

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  return catalogo.find((p) => p.slug === slug) ?? null
}

/** SPEC §4.1 bloque 5 — cuatro en grilla. Nada agotado: no se destaca lo que no se puede vender. */
export async function destacados(limite = 4): Promise<Producto[]> {
  return catalogo.filter((p) => estadoVisible(p) !== 'agotado').slice(0, limite)
}

/** SPEC §4.3 — "Completa el look". Respeta el orden de `combina_con`. */
export async function combinaCon(slug: string): Promise<Producto[]> {
  const producto = catalogo.find((p) => p.slug === slug)
  if (!producto) return []
  return producto.combina_con
    .map((otro) => catalogo.find((p) => p.slug === otro))
    .filter((p): p is Producto => Boolean(p))
}
