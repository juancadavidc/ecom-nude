import { Suspense } from 'react'
import { TrazoColumna } from '@/components/motion/Trazo'
import { Reveal } from '@/components/motion/Reveal'
import { opcionesDe } from '@/lib/filtros'
import type { Producto } from '@/lib/producto-modelo'
import { Filtros } from './Filtros'
import { GridFiltrado } from './GridFiltrado'
import { GridProducto } from './GridProducto'

/**
 * La plantilla del catalogo, compartida por /leggings, /tops, /sets y
 * /colecciones. Server Component: el HTML sale con todas las referencias
 * dentro, que es de donde sale el SEO (SPEC §9.5).
 *
 * El encabezado va sobre el eje izquierdo (§11.2). La referencia lo centra;
 * aqui no: centrar es el reflejo automatico de cualquier plantilla.
 */
export function Catalogo({
  titulo,
  intro,
  productos,
}: {
  titulo: string
  intro: string
  productos: Producto[]
}) {
  const opciones = opcionesDe(productos)

  return (
    <>
      <div className="container-nude">
        <header className="catalogo-head eje">
          <Reveal>
            <h1 className="display-l">{titulo}</h1>
          </Reveal>
          <Reveal delay={80}>
            <p className="body measure text-muted">{intro}</p>
          </Reveal>
        </header>
      </div>

      {/*
        Fallback `null` a proposito: sin JavaScript un filtro no puede hacer
        nada, asi que la barra no debe ocupar sitio. Lo que si tiene que quedar
        en el HTML es la grilla, y esa tiene su propio fallback mas abajo.
      */}
      <Suspense fallback={null}>
        <Filtros opciones={opciones} />
      </Suspense>

      <div className="container-nude">
        <div className="catalogo-cuerpo">
          <div className="catalogo-trazo" aria-hidden="true">
            <TrazoColumna alto="100%" />
          </div>

          <Suspense fallback={<GridProducto productos={productos} />}>
            <GridFiltrado productos={productos} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
