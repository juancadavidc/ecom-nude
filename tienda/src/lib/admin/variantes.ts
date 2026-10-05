import { slugificar, TALLAS, type Talla } from '@/lib/producto-modelo'

/**
 * Colores y tallas en el editor del panel. Logica pura: la usa el formulario en
 * el cliente para generar la grilla color × talla y el servidor para validarla.
 *
 * El SKU es lo que guarda el carrito de la clienta (localStorage) y lo que queda
 * copiado en cada pedido. Por eso un SKU que ya existe NO se regenera al editar:
 * se conserva tal cual mientras su color y su talla sigan existiendo.
 */

export type VarianteEditor = {
  color: string
  talla: Talla
  sku: string
  disponible: boolean
}

export type ColorEditor = {
  /** Nombre visible: "Café". */
  nombre: string
  hex: string
  /** null = cuesta lo mismo que el producto. */
  precio: number | null
  /** Prefijo de SKU del color. El SKU de cada talla es `<codigo>-<talla>`. */
  codigo: string
  /** Nombre con el que esta guardado en la base. null si el color es nuevo. */
  original: string | null
}

export function skuPorDefecto(codigo: string, talla: Talla): string {
  return `${codigo}-${talla}`
}

/**
 * Prefijo de SKU de un color a partir de sus variantes guardadas: el SKU sin el
 * `-<talla>` del final. Si las tallas no comparten prefijo, el de la primera.
 */
export function codigoDeColor(variantes: { talla: Talla; sku: string }[]): string {
  const prefijos = variantes.map((v) =>
    v.sku.endsWith(`-${v.talla}`) ? v.sku.slice(0, -(v.talla.length + 1)) : v.sku,
  )
  return prefijos[0] ?? ''
}

/**
 * Codigo para un color nuevo: iniciales del producto + color. "legging-rib" +
 * "Café" → "LR-CAFE". Si choca con uno usado se le agrega un numero.
 */
export function codigoPorDefecto(slugProducto: string, nombreColor: string, usados: Iterable<string>): string {
  const iniciales =
    slugificar(slugProducto)
      .split('-')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || 'NUDE'
  const color = slugificar(nombreColor).replace(/-/g, '').slice(0, 6).toUpperCase() || 'COLOR'
  const base = `${iniciales}-${color}`
  const ocupados = new Set([...usados].map((u) => u.toUpperCase()))
  if (!ocupados.has(base)) return base
  for (let n = 2; ; n++) if (!ocupados.has(`${base}${n}`)) return `${base}${n}`
}

/**
 * La grilla completa color × talla, en el orden de los colores y de `TALLAS`.
 * Reusa la variante actual de cada combinacion (SKU y disponibilidad intactos)
 * y crea con SKU por defecto y disponible solo las que faltan. Las variantes de
 * un color o una talla que ya no estan se descartan.
 */
export function sincronizarVariantes(
  colores: Pick<ColorEditor, 'nombre' | 'codigo'>[],
  tallas: Talla[],
  actuales: VarianteEditor[],
): VarianteEditor[] {
  const elegidas = TALLAS.filter((t) => tallas.includes(t))
  const resultado: VarianteEditor[] = []
  for (const c of colores) {
    for (const talla of elegidas) {
      const actual = actuales.find((v) => v.color === c.nombre && v.talla === talla)
      resultado.push(actual ?? { color: c.nombre, talla, sku: skuPorDefecto(c.codigo, talla), disponible: true })
    }
  }
  return resultado
}

/** Renombrar un color mueve sus variantes, no las recrea: el SKU no cambia. */
export function renombrarColor(variantes: VarianteEditor[], de: string, a: string): VarianteEditor[] {
  return variantes.map((v) => (v.color === de ? { ...v, color: a } : v))
}

/**
 * Cambiar el codigo de un color actualiza solo los SKU que seguian el patron del
 * codigo anterior. Un SKU escrito a mano no se pisa.
 */
export function cambiarCodigo(
  variantes: VarianteEditor[],
  color: string,
  anterior: string,
  nuevo: string,
): VarianteEditor[] {
  return variantes.map((v) =>
    v.color === color && v.sku === skuPorDefecto(anterior, v.talla) ? { ...v, sku: skuPorDefecto(nuevo, v.talla) } : v,
  )
}

/** SKU repetidos dentro del producto (comparando sin mayusculas). */
export function skusRepetidos(variantes: { sku: string }[]): string[] {
  const vistos = new Set<string>()
  const repetidos = new Set<string>()
  for (const { sku } of variantes) {
    const k = sku.trim().toUpperCase()
    if (vistos.has(k)) repetidos.add(sku.trim())
    vistos.add(k)
  }
  return [...repetidos]
}
