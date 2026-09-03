import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/format'

/**
 * SPEC §5 — Swatch de color y boton de talla.
 * Ambos son presentacionales: el estado lo maneja quien los usa (ficha de
 * producto, filtros de catalogo), que si es Client Component.
 *
 * El color del swatch es el unico lugar del sitio donde entra un hex que no
 * esta en la paleta: es el color real de la prenda, no un color de marca.
 */

type SwatchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Nombre del color, tal como lo ve la clienta: "Duna", "Umber". */
  nombre: string
  /** Hex de la tela. Dato de producto, no token de marca. */
  hex: string
  seleccionado?: boolean
}

export function Swatch({ nombre, hex, seleccionado = false, className, ...props }: SwatchProps) {
  return (
    <button
      type="button"
      {...props}
      // aria-pressed comunica el estado sin depender del anillo visual (SPEC §12)
      aria-pressed={seleccionado}
      aria-label={nombre}
      className={cx('swatch-hit', className)}
    >
      <span className="swatch" style={{ backgroundColor: hex }} />
    </button>
  )
}

type TallaProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  talla: string
  seleccionada?: boolean
  /** Agotada: se ve tachada, no desaparece (SPEC §4.3). */
  agotada?: boolean
}

export function BotonTalla({
  talla,
  seleccionada = false,
  agotada = false,
  className,
  ...props
}: TallaProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={agotada || props.disabled}
      aria-pressed={seleccionada}
      aria-label={agotada ? `Talla ${talla}, agotada por ahora` : `Talla ${talla}`}
      className={cx('size-btn', className)}
    >
      {talla}
    </button>
  )
}
