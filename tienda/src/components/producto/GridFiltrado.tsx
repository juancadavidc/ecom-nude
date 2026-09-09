'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Boton } from '@/components/ui/Button'
import { microcopy } from '@/lib/copy'
import { aplicarFiltros, leerFiltros } from '@/lib/filtros'
import type { Producto } from '@/lib/producto-modelo'
import { GridProducto } from './GridProducto'

/**
 * Aplica a la grilla los filtros que vienen en la URL y pagina con "Cargar mas".
 *
 * Es cliente por mejora progresiva: filtrar en el cliente evita el round-trip
 * al servidor en cada cambio de filtro, asi el resultado se ve al instante. La
 * pagina lo envuelve en un <Suspense> cuyo fallback es la grilla completa
 * renderizada en servidor; sin JavaScript ese fallback se queda, y con el las
 * ocho referencias en el HTML (SPEC §9.5, §12).
 *
 * Sin scroll infinito, a proposito: impide llegar al footer (SPEC §4.2).
 */
export function GridFiltrado({
  productos,
  porPagina = 6,
}: {
  productos: Producto[]
  porPagina?: number
}) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const clave = params.toString()

  const [paginas, setPaginas] = useState(1)

  // Cambiar un filtro vuelve a la primera pagina: si no, quitar un color puede
  // dejar a la clienta mirando el hueco donde estaba lo que ya habia cargado.
  // Ajustar el estado durante el render (en vez de en un useEffect) evita el
  // reflow extra de "renderiza con la pagina vieja, efecto, vuelve a
  // renderizar": react-hooks/set-state-in-effect lo marca porque es
  // exactamente el patron que React recomienda reemplazar.
  const [claveVista, setClaveVista] = useState(clave)
  if (clave !== claveVista) {
    setClaveVista(clave)
    setPaginas(1)
  }

  const visibles = aplicarFiltros(productos, leerFiltros(params))
  const mostrados = visibles.slice(0, paginas * porPagina)

  if (visibles.length === 0) {
    return (
      <div className="catalogo-vacio">
        <p className="quote">{microcopy.sinResultados}</p>
        <Boton variante="secundario" onClick={() => router.push(pathname, { scroll: false })}>
          {microcopy.quitarFiltros}
        </Boton>
      </div>
    )
  }

  return (
    <>
      <GridProducto productos={mostrados} />
      {mostrados.length < visibles.length && (
        <div className="cargar-mas">
          <Boton variante="secundario" onClick={() => setPaginas((n) => n + 1)}>
            {microcopy.cargarMas}
          </Boton>
        </div>
      )}
    </>
  )
}
