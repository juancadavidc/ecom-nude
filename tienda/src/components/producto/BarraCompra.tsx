'use client'

import { Boton } from '@/components/ui/Button'
import { microcopy } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import { estadoVisible } from '@/lib/producto-modelo'
import { useVariante } from './Variante'

/**
 * SPEC §4.3 — en movil, precio y "Agregar al carrito" siempre en pantalla.
 *
 * La referencia lo resuelve al reves: no tiene barra en la ficha y saca una
 * barra negra inferior DESPUES de agregar, como confirmacion. Aqui el boton
 * nunca se va de pantalla y la confirmacion es el panel lateral del §4.4.
 *
 * Sin talla elegida el boton no se desactiva: lleva al selector. Un boton muerto
 * en la barra que la clienta ve todo el rato no dice que le falta hacer.
 *
 * `.a-sangre`: la barra vive dentro de `.container-nude` pero el spec de diseno
 * §2.3 la pide a borde de pantalla; `.barra-compra` ya trae su propio
 * `padding-inline` para no perder el respiro interno al ir a sangre.
 */
export function BarraCompra() {
  const { producto, talla, variante, agregar } = useVariante()

  const agotado = estadoVisible(producto) === 'agotado'
  const listo = Boolean(talla && variante && variante.stock > 0)

  function irATallas() {
    const destino = document.getElementById('ficha-tallas')
    if (!destino) return
    destino.scrollIntoView({ block: 'center' })
    destino.querySelector<HTMLButtonElement>('.size-btn:not(:disabled)')?.focus()
  }

  return (
    <div className="barra-compra a-sangre">
      <p className="price-sm">{formatCOP(producto.precio)}</p>
      <Boton disabled={agotado} onClick={listo ? agregar : irATallas}>
        {agotado ? microcopy.agotado : listo ? microcopy.agregar : microcopy.elegirTalla}
      </Boton>
    </div>
  )
}
