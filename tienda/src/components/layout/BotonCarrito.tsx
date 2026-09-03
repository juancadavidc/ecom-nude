'use client'

import { useState } from 'react'
import { MarcaNude } from '@/components/brand/Logo'
import { BotonLink } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { ShoppingBag } from '@/components/ui/icons'

/**
 * SPEC §4.4 — El carrito es un panel lateral que entra desde la derecha,
 * no una pagina aparte ni una barra inferior como la referencia.
 *
 * Fase 1 entrega la carcasa y el estado vacio, que estan definidos al detalle
 * en el SPEC. La logica de items, cantidades y subtotal es de la fase 4:
 * `cantidad` y el contenido llegan por props cuando exista el store.
 */
export function BotonCarrito({ cantidad = 0 }: { cantidad?: number }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        className="icon-btn cart-btn"
        onClick={() => setAbierto(true)}
        aria-label={
          cantidad === 0
            ? 'Carrito, vacio'
            : `Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`
        }
        aria-expanded={abierto}
      >
        <ShoppingBag size={22} weight="light" />
        {cantidad > 0 && (
          <span className="cart-count" aria-hidden="true">
            {cantidad}
          </span>
        )}
      </button>

      <Panel abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Tu carrito">
        {cantidad === 0 ? <CarritoVacio onCerrar={() => setAbierto(false)} /> : null}
      </Panel>
    </>
  )
}

/** SPEC §7 — "Todavia no has elegido nada." Nunca "Tu carrito esta vacio 😢". */
function CarritoVacio({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="carrito-vacio">
      <MarcaNude alto={44} className="text-line" />
      <p className="quote">Todavia no has elegido nada.</p>
      <BotonLink href="/leggings" variante="secundario" onClick={onCerrar}>
        Ver leggings
      </BotonLink>
    </div>
  )
}
