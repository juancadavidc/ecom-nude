import archivo from '@/content/productos.json'
import { aplicarFiltros } from './filtros'
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

/**
 * `resolveJsonModule` infiere la forma literal del JSON: `categoria`, `talla` y
 * `estado` vuelven como `string`, no como las uniones cerradas que declara el
 * modelo, y por eso un `as Producto[]` directo no compila (TS2352: el literal
 * no tiene solapamiento suficiente con el tipo). El `unknown` de en medio es lo
 * que le dice al compilador que el ensanchamiento es intencional.
 *
 * A diferencia de `anuncios.ts`, aqui no hay validador en runtime. La
 * integridad del archivo la afirma `describe('integridad del archivo de
 * productos')` en `productos.test.ts`: slugs unicos, categorias y tallas del
 * vocabulario, el grafo de `combina_con` y la correspondencia
 * `imagenes`/`variantes`. El catalogo se empaqueta en build time, asi que una
 * edicion mala rompe `npm test` antes de llegar a un navegador. `anuncios.json`
 * si lleva validador porque un tono invalido rompe el contraste del header en
 * silencio; un producto invalido aqui rompe una prueba con nombre y linea.
 *
 * TODO(fase-2): cuando el catalogo venga de Firestore, los datos llegan en
 * runtime y estas pruebas dejan de vigilarlos — esa migracion tiene que traer
 * un validador real, no solo cambiar el `fetch`.
 *
 * TODO(decision-abierta-4): nombres de producto y de coleccion en el JSON son
 * provisionales. SPEC §13 deja abierta la nomenclatura; la confirma la marca.
 *
 * TODO(decision-abierta-5): todas las rutas de `imagenes` en el JSON apuntan a
 * marcas de posicion planas, no a fotografia. Es el cuello de botella real del
 * SPEC §13 y este trabajo no lo resuelve.
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

export async function listarProductos(
  opts: OpcionesListado = {},
): Promise<{ productos: Producto[]; siguiente: string | null }> {
  const { categoria, colores, tallas, precio, orden, cursor, limite } = opts

  // Categoria no es parte de `FiltrosActivos` — es una dimension de navegacion,
  // no de la barra de filtros — asi que se filtra aqui y el resto se delega a
  // `aplicarFiltros`, que ya sabe cruzar color/talla/precio y ordenar.
  const filtrados = aplicarFiltros(
    catalogo.filter((p) => !categoria || p.categoria === categoria),
    {
      colores: colores ?? [],
      tallas: tallas ?? [],
      precio: precio ?? {},
      orden: orden ?? 'novedad',
    },
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
