'use client'

import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { Ruler } from '@/components/ui/icons'
import { microcopy } from '@/lib/copy'
import { TABLA_TALLAS } from '@/lib/tallas'

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
            Medidas del cuerpo en centimetros. Si estas entre dos tallas, elige la mayor: la tela
            cede.
          </p>

          <div className="tabla-scroll">
            <table className="tabla-tallas">
              <caption className="visually-hidden">
                Equivalencia de tallas en centimetros de busto, cintura y cadera
              </caption>
              <thead>
                <tr>
                  <th scope="col">Talla</th>
                  <th scope="col">Busto</th>
                  <th scope="col">Cintura</th>
                  <th scope="col">Cadera</th>
                </tr>
              </thead>
              <tbody>
                {TABLA_TALLAS.map((fila) => (
                  <tr key={fila.talla}>
                    <th scope="row">{fila.talla}</th>
                    <td>{fila.busto}</td>
                    <td>{fila.cintura}</td>
                    <td>{fila.cadera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="field-hint">
            <Ruler size={16} weight="light" aria-hidden="true" /> Mide sobre la piel, sin apretar la
            cinta.
          </p>
        </div>
      </Panel>
    </>
  )
}
