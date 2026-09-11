import type { Talla } from './producto-modelo'

/**
 * `sku` es la llave: ya es unico por variante en el schema de Postgres
 * (`variantes.sku`), asi que no hace falta inventar un segundo identificador
 * para el item de carrito.
 */
export type ItemCarrito = {
  sku: string
  productoSlug: string
  nombre: string
  color: string
  talla: Talla
  precio: number
  imagen: string
  cantidad: number
}

/** Si el sku ya esta en el carrito, suma la cantidad en vez de duplicar la fila. */
export function agregarItem(
  items: ItemCarrito[],
  nuevo: Omit<ItemCarrito, 'cantidad'>,
  cantidad = 1,
): ItemCarrito[] {
  const existente = items.find((i) => i.sku === nuevo.sku)
  if (!existente) return [...items, { ...nuevo, cantidad }]
  return items.map((i) => (i.sku === nuevo.sku ? { ...i, cantidad: i.cantidad + cantidad } : i))
}

/** Cantidad <= 0 elimina la fila en vez de dejar un item en 0. */
export function actualizarCantidad(items: ItemCarrito[], sku: string, cantidad: number): ItemCarrito[] {
  if (cantidad <= 0) return eliminarItem(items, sku)
  return items.map((i) => (i.sku === sku ? { ...i, cantidad } : i))
}

export function eliminarItem(items: ItemCarrito[], sku: string): ItemCarrito[] {
  return items.filter((i) => i.sku !== sku)
}

export function totalesDe(items: ItemCarrito[]): { cantidad: number; subtotal: number } {
  return items.reduce(
    (acc, i) => ({ cantidad: acc.cantidad + i.cantidad, subtotal: acc.subtotal + i.precio * i.cantidad }),
    { cantidad: 0, subtotal: 0 },
  )
}
