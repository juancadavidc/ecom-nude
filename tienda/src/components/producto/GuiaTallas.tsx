'use client'

import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { Ruler } from '@/components/ui/icons'
import { microcopy } from '@/lib/copy'
import { TablaTallas } from './TablaTallas'

/**
 * SPEC §4.3 — link que abre panel lateral con la tabla de medidas. Reutiliza el
 * mismo <dialog> del carrito y del buscador.
 */
export function GuiaTallas() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button type="button" className="link body-s" onClick={() => setAbierto(true)}>
        {microcopy.guiaTallas}
      </button>

      <Panel abierto={abierto} onCerrar={() => setAbierto(false)} titulo={microcopy.guiaTallas}>
        <div className="flex flex-col gap-6">
          <p className="body-s text-muted">
            Medidas del cuerpo en centímetros. Si estás entre dos tallas, elige la mayor: la tela
            cede.
          </p>

          <TablaTallas />

          <p className="field-hint">
            <Ruler size={16} weight="light" aria-hidden="true" /> Mide sobre la piel, sin apretar la
            cinta.
          </p>
        </div>
      </Panel>
    </>
  )
}
