/**
 * Vocabulario del producto: tipos y derivaciones puras sobre un `Producto`.
 *
 * Vive aparte de `productos.ts` a proposito. El adaptador importa filtros y los
 * filtros importan tipos; si los tipos vivieran en el adaptador habria un ciclo
 * en tiempo de ejecucion. Aqui no hay nada que importar, asi que corta el ciclo.
 *
 * Modelo literal del SPEC §6. No se le agregan campos "por si acaso": lo que no
 * este aqui es lo que la fase 2 tendra que agregar tambien en Firestore.
 */

export type Categoria = 'leggings' | 'tops' | 'sets'
export type Talla = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type EstadoProducto = 'activo' | 'agotado' | 'proximamente'
export type Orden = 'novedad' | 'precio-asc' | 'precio-desc'

export type Variante = {
  /** Nombre del color tal como lo ve la clienta: "Duna". */
  color: string
  /** Hex de la tela. Dato de producto, no token de marca (SPEC §2.1). */
  hex: string
  talla: Talla
  sku: string
  stock: number
}

export type Producto = {
  nombre: string
  slug: string
  categoria: Categoria
  coleccion: string
  /** COP, entero, sin decimales. */
  precio: number
  descripcion: string
  detalles: string[]
  variantes: Variante[]
  /** Clave = nombre del color. Valor = nombres base en `public/fotos`. */
  imagenes: Record<string, string[]>
  /** Slugs de otros productos. */
  combina_con: string[]
  estado: EstadoProducto
  seo: { titulo: string; descripcion: string; alt: string }
}

export const CATEGORIAS = ['leggings', 'tops', 'sets'] as const satisfies readonly Categoria[]

/** SPEC §4.3 — el orden es el de la etiqueta, no alfabetico. */
export const TALLAS = ['XS', 'S', 'M', 'L', 'XL'] as const satisfies readonly Talla[]

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  leggings: 'Leggings',
  tops: 'Tops',
  sets: 'Sets',
}

/** SPEC §4.2 — copy de encabezado por categoria. Dos lineas, para SEO y tono. */
export const INTRO_CATEGORIA: Record<Categoria, string> = {
  leggings:
    'Tejido que se adapta y no se transparenta. Cintura alta que se queda donde la dejas, del primer paso al ultimo.',
  tops: 'Sujecion sin apretar. Se sienten como una segunda capa y se olvidan puestos.',
  sets: 'Legging y top pensados juntos: mismo tono, misma tela, misma caida.',
}

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor)
}

/** Colores del producto en el orden en que aparecen en `variantes`, sin repetir. */
export function coloresDe(p: Producto): { nombre: string; hex: string }[] {
  const vistos = new Map<string, string>()
  for (const v of p.variantes) if (!vistos.has(v.color)) vistos.set(v.color, v.hex)
  return [...vistos].map(([nombre, hex]) => ({ nombre, hex }))
}

/** Tallas del producto en el orden de `TALLAS`, no en el del archivo. */
export function tallasDe(p: Producto): Talla[] {
  const hay = new Set(p.variantes.map((v) => v.talla))
  return TALLAS.filter((t) => hay.has(t))
}

export function stockTotal(p: Producto): number {
  return p.variantes.reduce((n, v) => n + v.stock, 0)
}

export function varianteDe(p: Producto, color: string, talla: Talla): Variante | null {
  return p.variantes.find((v) => v.color === color && v.talla === talla) ?? null
}

export function stockDe(p: Producto, color: string, talla: Talla): number {
  return varianteDe(p, color, talla)?.stock ?? 0
}

export type EstadoVisible = 'activo' | 'ultimas' | 'agotado' | 'proximamente'

/**
 * SPEC §4.2 y §7 — el badge nunca grita. Solo hay tres motivos para poner uno,
 * y "ultimas unidades" tiene que ser cierto: se calcula del stock, no se marca
 * a mano en el archivo.
 */
export const UMBRAL_ULTIMAS = 5

export function estadoVisible(p: Producto): EstadoVisible {
  if (p.estado === 'proximamente') return 'proximamente'
  const total = stockTotal(p)
  if (p.estado === 'agotado' || total === 0) return 'agotado'
  if (total <= UMBRAL_ULTIMAS) return 'ultimas'
  return 'activo'
}
