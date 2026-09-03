'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CampoTexto } from '@/components/ui/Field'
import { Boton } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { MagnifyingGlass } from '@/components/ui/icons'
import { cx } from '@/lib/format'

/**
 * Buscador del header. El icono aparece en dos sitios distintos del grid
 * (izquierda en movil, derecha en desktop) y son nodos separados del DOM, pero
 * el panel tiene que ser uno solo: dos <dialog> con el mismo contenido serian
 * dos trampas de foco compitiendo.
 *
 * Por eso el estado vive en el proveedor y los botones solo lo abren. El
 * proveedor envuelve el interior del header, que sigue siendo Server Component:
 * los hijos llegan ya renderizados como children.
 */

const AbrirBuscador = createContext<(() => void) | null>(null)

export function BuscadorProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const abrir = useCallback(() => setAbierto(true), [])

  return (
    <AbrirBuscador.Provider value={abrir}>
      {children}

      <Panel abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Buscar" lado="derecha">
        {/* GET plano: funciona sin JavaScript y deja la consulta en la URL,
            que es lo que la pagina de resultados necesita.
            TODO(fase-3): /buscar existe cuando exista catalogo que buscar. */}
        <form action="/buscar" method="get" className="buscador-form" role="search">
          <CampoTexto
            id="buscador-q"
            name="q"
            label="Buscar en la tienda"
            type="search"
            autoComplete="off"
            placeholder="Leggings, tops, sets"
          />
          <Boton type="submit">Buscar</Boton>
        </form>
      </Panel>
    </AbrirBuscador.Provider>
  )
}

export function BotonBuscar({ className }: { className?: string }) {
  const abrir = useContext(AbrirBuscador)
  if (!abrir) throw new Error('BotonBuscar necesita estar dentro de BuscadorProvider')

  return (
    <button type="button" className={cx('icon-btn', className)} aria-label="Buscar" onClick={abrir}>
      <MagnifyingGlass size={22} weight="light" />
    </button>
  )
}
