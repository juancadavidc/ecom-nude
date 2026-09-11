'use client'

import { useState } from 'react'
import { useCarrito } from '@/components/carrito/CarritoProvider'
import { MarcaNude } from '@/components/brand/Logo'
import { Boton, BotonLink } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { Handbag, Minus, Plus, Trash } from '@/components/ui/icons'
import { microcopy } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import type { ItemCarrito } from '@/lib/carrito'

/**
 * SPEC §4.4 — El carrito es un panel lateral que entra desde la derecha,
 * no una pagina aparte ni una barra inferior como la referencia.
 */
export function BotonCarrito() {
  const [abierto, setAbierto] = useState(false)
  const { items, cantidadTotal, subtotal, actualizarCantidad, eliminar } = useCarrito()

  return (
    <>
      <button
        type="button"
        className="icon-btn cart-btn"
        onClick={() => setAbierto(true)}
        aria-label={
          cantidadTotal === 0
            ? 'Carrito, vacio'
            : `Carrito, ${cantidadTotal} ${cantidadTotal === 1 ? 'producto' : 'productos'}`
        }
        aria-expanded={abierto}
      >
        <Handbag size={22} weight="light" />
        {cantidadTotal > 0 && (
          <span className="cart-count" aria-hidden="true">
            {cantidadTotal}
          </span>
        )}
      </button>

      <Panel
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Tu carrito"
        pie={
          items.length > 0 ? (
            <div className="carrito-pie">
              <div className="carrito-subtotal">
                <span>Subtotal</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <p className="carrito-nota-envio">{microcopy.envioEnCheckout}</p>
              <BotonLink href="/checkout" ancho onClick={() => setAbierto(false)}>
                {microcopy.finalizar}
              </BotonLink>
              <Boton variante="secundario" ancho onClick={() => setAbierto(false)}>
                {microcopy.seguirViendo}
              </Boton>
            </div>
          ) : undefined
        }
      >
        {items.length === 0 ? (
          <CarritoVacio onCerrar={() => setAbierto(false)} />
        ) : (
          <ul className="carrito-lista">
            {items.map((item) => (
              <FilaCarrito
                key={item.sku}
                item={item}
                onCantidad={(cantidad) => actualizarCantidad(item.sku, cantidad)}
                onEliminar={() => eliminar(item.sku)}
              />
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}

function FilaCarrito({
  item,
  onCantidad,
  onEliminar,
}: {
  item: ItemCarrito
  onCantidad: (cantidad: number) => void
  onEliminar: () => void
}) {
  return (
    <li className="carrito-item">
      <img src={item.imagen} alt="" className="carrito-item-img" />
      <div className="carrito-item-info">
        <p className="carrito-item-nombre">{item.nombre}</p>
        <p className="carrito-item-variante">
          {item.color} · {item.talla}
        </p>
        <div className="carrito-item-cantidad">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onCantidad(item.cantidad - 1)}
            aria-label="Quitar una unidad"
          >
            <Minus size={16} weight="light" />
          </button>
          <span aria-live="polite">{item.cantidad}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onCantidad(item.cantidad + 1)}
            aria-label="Agregar una unidad"
          >
            <Plus size={16} weight="light" />
          </button>
        </div>
      </div>
      <p className="carrito-item-precio">{formatCOP(item.precio * item.cantidad)}</p>
      <button
        type="button"
        className="icon-btn"
        onClick={onEliminar}
        aria-label={`${microcopy.eliminarDelCarrito}: ${item.nombre}`}
      >
        <Trash size={18} weight="light" />
      </button>
    </li>
  )
}

/** SPEC §7 — "Todavia no has elegido nada." Nunca "Tu carrito esta vacio 😢". */
function CarritoVacio({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="carrito-vacio">
      <MarcaNude alto={44} className="text-line" />
      <p className="quote">{microcopy.carritoVacio}</p>
      <BotonLink href="/leggings" variante="secundario" onClick={onCerrar}>
        Ver leggings
      </BotonLink>
    </div>
  )
}
