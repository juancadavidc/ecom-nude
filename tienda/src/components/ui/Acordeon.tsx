'use client'

import { useId, useState, type ReactNode } from 'react'
import { CaretDown } from './icons'

/**
 * SPEC §5 — Acordeon: titulo Jost 400 13px mayusculas, chevron a la derecha,
 * linea Ochre 25% arriba. Todos cerrados por defecto.
 *
 * El contenido siempre esta en el DOM: se colapsa con grid-template-rows 0fr→1fr,
 * no con `display: none`. Asi Google lo indexa aunque este cerrado (SPEC §12) y
 * la animacion llega a altura automatica sin medir nada con JS.
 */

export function Acordeon({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

export function ItemAcordeon({
  titulo,
  children,
  abiertoInicial = false,
}: {
  titulo: string
  children: ReactNode
  abiertoInicial?: boolean
}) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  const id = useId()
  const idPanel = `${id}-panel`
  const idTrigger = `${id}-trigger`

  return (
    <div className="accordion">
      <h3>
        <button
          type="button"
          id={idTrigger}
          className="accordion-trigger"
          aria-expanded={abierto}
          aria-controls={idPanel}
          onClick={() => setAbierto((v) => !v)}
        >
          <span>{titulo}</span>
          <CaretDown size={18} weight="light" className="accordion-icon" />
        </button>
      </h3>
      <div
        className="accordion-panel"
        data-open={abierto}
        id={idPanel}
        role="region"
        aria-labelledby={idTrigger}
      >
        <div>
          <div className="accordion-body">{children}</div>
        </div>
      </div>
    </div>
  )
}
