'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '@/lib/format'
import { X } from './icons'

/**
 * Panel lateral. Es la misma pieza para tres cosas del SPEC:
 * carrito (§4.4, entra desde la derecha), nav movil (§5, desde la izquierda,
 * fondo Umber) y guia de tallas (§4.3).
 *
 * Se apoya en <dialog> nativo con showModal(): trampa de foco, cierre con Esc y
 * el resto de la pagina inerte vienen del navegador, no de codigo que hay que
 * mantener. La animacion de entrada y salida usa @starting-style +
 * `allow-discrete` (ver globals.css), asi que el cierre tambien se anima.
 */

type PanelProps = {
  abierto: boolean
  onCerrar: () => void
  /** Nombre accesible del panel. Obligatorio. */
  titulo: string
  /** Si es false, el titulo existe solo para el lector de pantalla. */
  mostrarTitulo?: boolean
  lado?: 'izquierda' | 'derecha'
  tono?: 'claro' | 'oscuro'
  children: ReactNode
  /** Bloque fijo al fondo: subtotal + boton de checkout, por ejemplo. */
  pie?: ReactNode
}

export function Panel({
  abierto,
  onCerrar,
  titulo,
  mostrarTitulo = true,
  lado = 'derecha',
  tono = 'claro',
  children,
  pie,
}: PanelProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (abierto && !el.open) el.showModal()
    if (!abierto && el.open) el.close()
  }, [abierto])

  // showModal() vuelve inerte el resto de la pagina pero no frena el scroll del body
  useEffect(() => {
    if (!abierto) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className={cx('drawer', `drawer-${lado}`, tono === 'oscuro' && 'on-dark')}
      aria-label={titulo}
      // Esc y cierre nativo avisan al padre para que el estado no se desincronice
      onClose={onCerrar}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      onClick={(e) => {
        // un clic en el backdrop llega al propio <dialog>, no a su contenido
        if (e.target === ref.current) onCerrar()
      }}
    >
      <div className="drawer-inner">
        <header className="drawer-head">
          <h2 className={cx('label', !mostrarTitulo && 'visually-hidden')}>{titulo}</h2>
          <button type="button" className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} weight="light" />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {pie && <footer className="drawer-foot">{pie}</footer>}
      </div>
    </dialog>
  )
}
