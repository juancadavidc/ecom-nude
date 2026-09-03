import Link from 'next/link'
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react'
import { cx } from '@/lib/format'

/**
 * SPEC §5 — Botones.
 * primario: fondo Umber, texto Cream. Hover: Ochre + translateY(-1px).
 * secundario: transparente, borde Umber. Hover: se invierte.
 * invert / outline-invert: los mismos dos, sobre fondo Umber.
 *
 * SPEC §12 — todo boton tiene estado de carga. Nada cambia en 0ms.
 */

export type VarianteBoton = 'primario' | 'secundario' | 'invert' | 'outline-invert'

const clases: Record<VarianteBoton, string> = {
  primario: 'btn-primary',
  secundario: 'btn-secondary',
  invert: 'btn-invert',
  'outline-invert': 'btn-outline-invert',
}

function claseBase(variante: VarianteBoton, ancho: boolean, extra?: string) {
  return cx('btn', clases[variante], ancho && 'btn-block', extra)
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton
  ancho?: boolean
  cargando?: boolean
  children: ReactNode
}

export function Boton({
  variante = 'primario',
  ancho = false,
  cargando = false,
  className,
  children,
  disabled,
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={claseBase(variante, ancho, className)}
    >
      {/* El texto no se quita al cargar: se atenua a opacidad 0 y sigue
          midiendo. Si se reemplazara, el boton se encogeria y saltaria el
          layout — y con `visibility: hidden` perderia su nombre accesible:
          el lector de pantalla diria "Un momento" en vez de la accion. */}
      <span className={cargando ? 'btn-oculto' : undefined}>{children}</span>
      {cargando && <Puntos />}
    </button>
  )
}

type BotonLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  variante?: VarianteBoton
  ancho?: boolean
  className?: string
  children: ReactNode
}

export function BotonLink({
  variante = 'primario',
  ancho = false,
  className,
  children,
  ...props
}: BotonLinkProps) {
  return (
    <Link {...props} className={claseBase(variante, ancho, className)}>
      {children}
    </Link>
  )
}

/**
 * Indicador de carga: tres puntos que se encienden en secuencia.
 * No gira nada (SPEC §11.3). Es puramente visual: el estado para lector de
 * pantalla lo dan `aria-busy` y `disabled` en el boton, que conservan el
 * nombre de la accion.
 */
function Puntos() {
  return (
    <span className="btn-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}
