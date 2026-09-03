'use client'

import type { ReactNode } from 'react'
import { cx } from '@/lib/format'
import { useEnVista } from './useEnVista'

/**
 * SPEC §11.3 — entrada de seccion: fade + 12px hacia arriba, 350ms, power1.out.
 *
 * Lo importante esta en globals.css: el estado oculto (`opacity: 0`) solo aplica
 * bajo `html.js`. Sin JavaScript el contenido se ve y Google indexa la pagina
 * completa, no una en blanco (SPEC §9.5).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  /** Escalonado en ms. Util para una grilla: 0, 60, 120... */
  delay?: number
  className?: string
}) {
  const { ref, enVista } = useEnVista<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cx('reveal', className)}
      data-visible={enVista || undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
