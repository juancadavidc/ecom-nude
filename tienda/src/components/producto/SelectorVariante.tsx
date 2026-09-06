'use client'

import { Boton } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { BotonTalla, Swatch } from '@/components/ui/Selectores'
import { microcopy } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import { estadoVisible } from '@/lib/producto-modelo'
import { GuiaTallas } from './GuiaTallas'
import { useVariante } from './Variante'

/**
 * Las piezas del bloque de compra que dependen del color y de la talla elegidos.
 * Van sueltas y sin props para que la pagina las coloque en el orden del SPEC
 * §4.3 sin tener que convertir toda la columna en un Client Component: entre una
 * y otra hay parrafos que renderiza el servidor.
 */

/** SKU de la variante elegida; el del color mientras no hay talla. */
export function SkuActivo() {
  const { producto, color, variante } = useVariante()
  const sku = variante?.sku ?? producto.variantes.find((v) => v.color === color)?.sku
  return <p className="ficha-sku">{sku}</p>
}

/** SPEC §4.3 — swatches circulares de 32px con el nombre del elegido al lado. */
export function SelectorColor() {
  const { colores, color, elegirColor } = useVariante()
  if (colores.length < 2) return null

  return (
    <div className="ficha-bloque">
      <div className="ficha-color-head">
        <span className="label text-muted">Color</span>
        <span className="body-s">{color}</span>
      </div>
      <div className="ficha-opciones">
        {colores.map((c) => (
          <Swatch
            key={c.nombre}
            nombre={c.nombre}
            hex={c.hex}
            seleccionado={c.nombre === color}
            onClick={() => elegirColor(c.nombre)}
          />
        ))}
      </div>
    </div>
  )
}

/** SPEC §4.3 — las agotadas se ven tachadas, no desaparecen. */
export function SelectorTalla() {
  const { tallas, talla, elegirTalla, stockDeTalla } = useVariante()

  return (
    // El id es el ancla de la barra de compra de movil (tarea 9): sin talla
    // elegida, su boton trae aqui en vez de quedarse muerto.
    <div className="ficha-bloque" id="ficha-tallas">
      <div className="ficha-talla-head">
        <span className="label text-muted">Talla</span>
        <GuiaTallas />
      </div>
      <div className="ficha-opciones">
        {tallas.map((t) => (
          <BotonTalla
            key={t}
            talla={t}
            seleccionada={t === talla}
            agotada={stockDeTalla(t) === 0}
            onClick={() => elegirTalla(t)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * SPEC §7 — "Ultimas 3 unidades" solo si es cierto. Sin contadores regresivos y
 * sin "12 personas viendo esto": la urgencia falsa es lo contrario a confianza
 * silenciosa. Por eso solo se pinta cuando hay talla elegida y el numero sale
 * del stock de esa variante.
 */
export function AvisoInventario() {
  const { talla, variante } = useVariante()
  if (!talla || !variante || variante.stock === 0 || variante.stock > 3) return null

  return (
    <p className="body-s ficha-inventario" role="status">
      {variante.stock === 1
        ? `Ultima unidad en talla ${talla}`
        : `Ultimas ${variante.stock} unidades en talla ${talla}`}
    </p>
  )
}

/** SPEC §4.3 — boton Umber solido, ancho completo. */
export function BotonAgregar() {
  const { producto, talla, variante, agregar } = useVariante()

  const agotado = estadoVisible(producto) === 'agotado'
  const listo = Boolean(talla && variante && variante.stock > 0)

  return (
    <Boton ancho disabled={agotado || !listo} onClick={agregar}>
      {agotado ? microcopy.agotado : listo ? microcopy.agregar : microcopy.elegirTalla}
    </Boton>
  )
}

/**
 * SPEC §4.4 — la confirmacion es el panel lateral, no una barra inferior ni una
 * pagina aparte. Se monta UNA sola vez por ficha: lo abren tanto este bloque como
 * la barra de compra de movil (tarea 9).
 *
 * TODO(fase-4): el carrito de verdad —estado, cantidades, subtotal— es de la
 * fase 4. Lo que falta es persistir lo elegido, no la pantalla.
 */
export function PanelConfirmacion() {
  const { producto, color, talla, confirmado, cerrarConfirmacion } = useVariante()

  return (
    <Panel
      abierto={confirmado}
      onCerrar={cerrarConfirmacion}
      titulo="Tu carrito"
      pie={
        <Boton variante="secundario" ancho onClick={cerrarConfirmacion}>
          {microcopy.seguirViendo}
        </Boton>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="quote">{microcopy.agregado}</p>
        <p className="body-s text-muted">
          {producto.nombre} · {color} · Talla {talla}
        </p>
        <p className="price-sm">{formatCOP(producto.precio)}</p>
      </div>
    </Panel>
  )
}
