'use client'

import { useEffect } from 'react'
import { useCarrito } from '@/components/carrito/CarritoProvider'

/**
 * Saca del carrito lo que ya quedo en el pedido. Solo corre cuando la
 * confirmacion llega recien creada (`?nuevo=1`): volver a abrir el enlace de un
 * pedido viejo no toca el carrito.
 *
 * Quita los skus del pedido, no todo el carrito: si la clienta tenia algo mas
 * agregado en otra pestaña, eso se queda. Depende de `items` porque el
 * carrito se carga de localStorage despues del primer render; cuando ya no
 * queda nada que quitar, limpia la URL para que recargar no repita.
 */
export function VaciarCarrito({ skus }: { skus: string[] }) {
  const { items, eliminar } = useCarrito()
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('nuevo')) return
    const pendientes = items.filter((i) => skus.includes(i.sku))
    if (!pendientes.length) return
    for (const i of pendientes) eliminar(i.sku)
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [items, skus, eliminar])
  return null
}
