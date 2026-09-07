'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { List } from '@/components/ui/icons'
import { prefetchable, site } from '@/lib/site'

/**
 * SPEC §5 — Nav movil: panel desde la izquierda, fondo Umber, texto Cream,
 * items Jost 300 18px.
 *
 * La referencia (camilaperezsport.com) usa un boton flotante fijo "NAVEGACION"
 * abajo. Se alcanza con el pulgar y es buena idea de usabilidad, pero un
 * rectangulo permanente sobre el contenido rompe el aire que define a NUDE.
 * Aqui se resuelve con hamburguesa en el header fijo.
 */

type Item = { label: string; href: string }

export function NavMovil({ items }: { items: readonly Item[] }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        className="icon-btn md:hidden"
        aria-label="Abrir menu"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
      >
        <List size={22} weight="light" />
      </button>

      <Panel
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Menu"
        mostrarTitulo={false}
        lado="izquierda"
        tono="oscuro"
      >
        <nav aria-label="Navegacion principal">
          <ul className="nav-movil">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  prefetch={prefetchable(item.href) ? undefined : false}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <hr className="rule mt-8 mb-6" />

        {/* TODO(fase-3): el buscador entra aqui junto con el catalogo.
            Mientras no haya producto que buscar, no se pinta un boton muerto. */}
        <ul className="nav-movil-links">
          <li>
            <Link href="/guia-de-tallas" onClick={() => setAbierto(false)} prefetch={false}>
              Guia de tallas
            </Link>
          </li>
          <li>
            <Link href="/envios" onClick={() => setAbierto(false)} prefetch={false}>
              Envios y entregas
            </Link>
          </li>
          <li>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </li>
        </ul>
      </Panel>
    </>
  )
}
