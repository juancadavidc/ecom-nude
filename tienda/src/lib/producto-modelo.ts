/**
 * Vocabulario del producto: tipos y derivaciones puras sobre un `Producto`.
 *
 * Vive aparte de `productos.ts` a proposito. El adaptador importa filtros y los
 * filtros importan tipos; si los tipos vivieran en el adaptador habria un ciclo
 * en tiempo de ejecucion. Aqui no hay nada que importar, asi que corta el ciclo.
 *
 * No se maneja inventario: una variante esta disponible o no. Las categorias
 * viven en Postgres (`categorias`), asi que aqui una categoria es solo su slug.
 */

export type Categoria = string
export type Talla = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'U'
export type EstadoProducto = 'activo' | 'agotado' | 'proximamente' | 'borrador'
export type Orden = 'novedad' | 'precio-asc' | 'precio-desc'

export type InfoCategoria = {
  slug: string
  nombre: string
  intro: string
  orden: number
  visible: boolean
}

export type Variante = {
  /** Nombre del color tal como lo ve la clienta: "Café". */
  color: string
  /** Hex de la tela. Dato de producto, no token de marca (SPEC §2.1). */
  hex: string
  talla: Talla
  sku: string
  disponible: boolean
  /** null = cuesta lo mismo que el producto. */
  precio: number | null
}

export type Producto = {
  nombre: string
  slug: string
  categoria: Categoria
  /** Nombre visible de la categoria, resuelto en la consulta. */
  categoriaNombre: string
  coleccion: string
  /** Precio base en COP, entero, sin decimales. */
  precio: number
  descripcion: string
  detalles: string[]
  variantes: Variante[]
  /** Clave = nombre del color. Valor = nombres base de foto (ver `urlFoto`). */
  imagenes: Record<string, string[]>
  /** Slugs de otros productos. */
  combina_con: string[]
  estado: EstadoProducto
  destacado: boolean
  seo: { titulo: string; descripcion: string; alt: string }
}

/** SPEC §4.3 — el orden es el de la etiqueta, no alfabetico. `U` va al final. */
export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'U'] as const satisfies readonly Talla[]

export const NOMBRE_TALLA: Record<Talla, string> = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  U: 'Única',
}

export function esTalla(valor: string): valor is Talla {
  return (TALLAS as readonly string[]).includes(valor)
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

export function varianteDe(p: Producto, color: string, talla: Talla): Variante | null {
  return p.variantes.find((v) => v.color === color && v.talla === talla) ?? null
}

export function disponibleDe(p: Producto, color: string, talla: Talla): boolean {
  return varianteDe(p, color, talla)?.disponible ?? false
}

/** Precio de un color: el suyo si lo tiene, si no el del producto. */
export function precioDe(p: Producto, color: string): number {
  return p.variantes.find((v) => v.color === color && v.precio != null)?.precio ?? p.precio
}

/** Menor y mayor precio entre los colores. Iguales cuando todo cuesta lo mismo. */
export function rangoPrecio(p: Producto): { min: number; max: number } {
  const precios = coloresDe(p).map((c) => precioDe(p, c.nombre))
  if (!precios.length) return { min: p.precio, max: p.precio }
  return { min: Math.min(...precios), max: Math.max(...precios) }
}

export function hayDisponible(p: Producto): boolean {
  return p.variantes.some((v) => v.disponible)
}

export type EstadoVisible = 'activo' | 'agotado' | 'proximamente'

/**
 * SPEC §4.2 y §7 — el badge nunca grita. Sin inventario no hay "ultimas
 * unidades": solo agotado (marcado a mano o sin ninguna variante disponible) y
 * proximamente.
 */
export function estadoVisible(p: Producto): EstadoVisible {
  if (p.estado === 'proximamente') return 'proximamente'
  if (p.estado === 'agotado' || !hayDisponible(p)) return 'agotado'
  return 'activo'
}

/** Slug a partir de un nombre: "Enterizo Tela Fría" → "enterizo-tela-fria". */
export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
