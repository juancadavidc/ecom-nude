'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Boton } from '@/components/ui/Button'
import { CampoLista, CampoTexto } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { BotonTalla, Swatch } from '@/components/ui/Selectores'
import { microcopy } from '@/lib/copy'
import type { FiltrosActivos, OpcionesFiltro } from '@/lib/filtros'
import { cuantosActivos, escribirFiltros, leerFiltros } from '@/lib/filtros'
import type { Orden, Talla } from '@/lib/producto-modelo'

/**
 * SPEC §4.2 — Color · Talla · Precio · Ordenar, en barra pegajosa bajo el
 * header. En movil abre panel inferior.
 *
 * Todo el estado vive en la URL, no en `useState`: asi un filtro se comparte por
 * WhatsApp y el boton atras del navegador funciona. `router.replace` en vez de
 * `push` para que atras salga del catalogo en un toque en vez de deshacer filtro
 * a filtro.
 *
 * Desde 1024px las cuatro dimensiones se ven enteras en la barra: con cuatro
 * colores y cinco tallas, un desplegable esconde mas de lo que ordena. Debajo de
 * ese ancho no caben y el detalle se va al panel.
 */
export function Filtros({ opciones }: { opciones: OpcionesFiltro }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [panelAbierto, setPanelAbierto] = useState(false)

  const filtros = leerFiltros(params)
  const activos = cuantosActivos(filtros)

  function aplicar(cambio: Partial<FiltrosActivos>) {
    const query = escribirFiltros({ ...filtros, ...cambio })
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function alternar<T extends string>(lista: T[], valor: T): T[] {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
  }

  const controles = (
    <>
      <div className="filtro-grupo">
        <span className="label filtro-grupo-titulo">Color</span>
        <div className="filtro-controles">
          {opciones.colores.map((color) => (
            <Swatch
              key={color.nombre}
              nombre={color.nombre}
              hex={color.hex}
              seleccionado={filtros.colores.includes(color.nombre)}
              onClick={() => aplicar({ colores: alternar(filtros.colores, color.nombre) })}
            />
          ))}
        </div>
      </div>

      <div className="filtro-grupo">
        <span className="label filtro-grupo-titulo">Talla</span>
        <div className="filtro-controles">
          {opciones.tallas.map((talla) => (
            <BotonTalla
              key={talla}
              talla={talla}
              seleccionada={filtros.tallas.includes(talla)}
              onClick={() => aplicar({ tallas: alternar<Talla>(filtros.tallas, talla) })}
            />
          ))}
        </div>
      </div>

      <div className="filtro-grupo">
        <span className="label filtro-grupo-titulo">Precio</span>
        <div className="filtro-precio">
          <CampoTexto
            id="filtro-min"
            label="Desde"
            type="number"
            inputMode="numeric"
            min={opciones.precio.min}
            max={opciones.precio.max}
            step={1000}
            value={filtros.precio.min ?? ''}
            onChange={(e) =>
              aplicar({
                precio: { ...filtros.precio, min: e.target.value ? Number(e.target.value) : undefined },
              })
            }
          />
          <CampoTexto
            id="filtro-max"
            label="Hasta"
            type="number"
            inputMode="numeric"
            min={opciones.precio.min}
            max={opciones.precio.max}
            step={1000}
            value={filtros.precio.max ?? ''}
            onChange={(e) =>
              aplicar({
                precio: { ...filtros.precio, max: e.target.value ? Number(e.target.value) : undefined },
              })
            }
          />
        </div>
      </div>

      <div className="filtro-grupo">
        <CampoLista
          id="filtro-orden"
          label={microcopy.ordenar}
          value={filtros.orden}
          onChange={(e) => aplicar({ orden: e.target.value as Orden })}
        >
          <option value="novedad">Novedad</option>
          <option value="precio-asc">Precio, de menor a mayor</option>
          <option value="precio-desc">Precio, de mayor a menor</option>
        </CampoLista>
      </div>
    </>
  )

  return (
    <div className="barra-filtros">
      <div className="container-nude barra-filtros-inner">
        <div className="filtros-desktop">{controles}</div>

        <div className="filtros-movil">
          <Boton variante="secundario" onClick={() => setPanelAbierto(true)}>
            {activos ? `${microcopy.filtrar} (${activos})` : microcopy.filtrar}
          </Boton>
        </div>

        {activos > 0 && (
          <Boton
            variante="secundario"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            {microcopy.quitarFiltros}
          </Boton>
        )}
      </div>

      <Panel
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        titulo="Filtrar y ordenar"
        lado="abajo"
        pie={
          <Boton ancho onClick={() => setPanelAbierto(false)}>
            Ver productos
          </Boton>
        }
      >
        <div className="filtro-panel">{controles}</div>
      </Panel>
    </div>
  )
}
