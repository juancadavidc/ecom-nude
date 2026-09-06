import { Suspense } from 'react'
import { TrazoColumna } from '@/components/motion/Trazo'
import { Reveal } from '@/components/motion/Reveal'
import type { Producto } from '@/lib/producto-modelo'
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
  return (
    <div className="container-nude">
      <header className="catalogo-head eje">
        <Reveal>
          <h1 className="display-l">{titulo}</h1>
        </Reveal>
        <Reveal delay={80}>
          <p className="body measure text-muted">{intro}</p>
        </Reveal>
      </header>

      <div className="catalogo-cuerpo">
        <div className="catalogo-trazo" aria-hidden="true">
          <TrazoColumna alto="100%" />
        </div>

        {/*
          El fallback NO es un esqueleto: es la grilla entera renderizada en
          servidor. Con export estatico es lo que queda en el HTML, asi que sin
          JavaScript la clienta ve el catalogo completo en vez de un hueco.
        */}
        <Suspense fallback={<GridProducto productos={productos} />}>
          <GridFiltrado productos={productos} />
        </Suspense>
      </div>
    </div>
  )
}
