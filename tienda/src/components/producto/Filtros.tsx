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
 * WhatsApp y el boton atras del navegador funciona (SPEC §7, §4 bloque 2).
 * `router.push`, no `replace`: cada filtro aplicado apila su propia entrada de
 * historial, para que atras deshaga un filtro a la vez — que es justo lo que
 * pide el SPEC, no un atajo para salir del catalogo de un tiro.
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
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="barra-filtros">
      <div className="container-nude barra-filtros-inner">
        <div className="filtros-desktop">
          <ControlesFiltro prefijo="desktop" opciones={opciones} filtros={filtros} aplicar={aplicar} />
        </div>

        <div className="filtros-movil">
          <Boton variante="secundario" onClick={() => setPanelAbierto(true)}>
            {activos ? `${microcopy.filtrar} (${activos})` : microcopy.filtrar}
          </Boton>
        </div>

        {activos > 0 && (
          <Boton variante="secundario" onClick={() => router.push(pathname, { scroll: false })}>
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
        <div className="filtro-panel">
          <ControlesFiltro prefijo="movil" opciones={opciones} filtros={filtros} aplicar={aplicar} />
        </div>
      </Panel>
    </div>
  )
}

function alternar<T extends string>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
}

/**
 * Las cuatro dimensiones, una vez por instancia (barra de escritorio y panel
 * de movil). Un componente con nombre propio en vez de una variable JSX: asi
 * React conserva su identidad entre renders y el estado local de
 * `CamposPrecio` (mas abajo) no se resetea cada vez que cambia un filtro.
 *
 * `prefijo` distingue los `id` de cada instancia (`filtro-desktop-*` /
 * `filtro-movil-*`): las dos instancias existen a la vez en el DOM — una
 * oculta por CSS segun el ancho — y un `id` repetido rompe la asociacion de
 * `<label>` con su campo (puede apuntar a la instancia equivocada).
 */
function ControlesFiltro({
  prefijo,
  opciones,
  filtros,
  aplicar,
}: {
  prefijo: string
  opciones: OpcionesFiltro
  filtros: FiltrosActivos
  aplicar: (cambio: Partial<FiltrosActivos>) => void
}) {
  return (
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
        <CamposPrecio
          prefijo={prefijo}
          precio={filtros.precio}
          limiteMin={opciones.precio.min}
          limiteMax={opciones.precio.max}
          onConfirmar={(precio) => aplicar({ precio })}
        />
      </div>

      <div className="filtro-grupo">
        <CampoLista
          id={`filtro-${prefijo}-orden`}
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
}

const aTexto = (n?: number) => (n != null ? String(n) : '')

/**
 * Desde/Hasta no escriben en la URL en cada tecla. Con `push` eso apilaria una
 * entrada de historial por digito escrito, y atras dejaria de servir para
 * deshacer un filtro de un tiro — justo lo que el SPEC pide. El valor se
 * guarda en estado local mientras se escribe y se confirma con blur o Enter.
 *
 * El estado local se resincroniza cuando el precio de la URL cambia por otra
 * via — atras, adelante, un enlace pegado — comparando en el render en vez de
 * en un efecto: `react-hooks/set-state-in-effect` lo rechaza, y es el mismo
 * patron que ya usa `GridFiltrado.tsx` para resetear su pagina.
 */
function CamposPrecio({
  prefijo,
  precio,
  limiteMin,
  limiteMax,
  onConfirmar,
}: {
  prefijo: string
  precio: FiltrosActivos['precio']
  limiteMin: number
  limiteMax: number
  onConfirmar: (precio: FiltrosActivos['precio']) => void
}) {
  const [valores, setValores] = useState({ min: aTexto(precio.min), max: aTexto(precio.max) })

  const clave = `${precio.min ?? ''}|${precio.max ?? ''}`
  const [claveVista, setClaveVista] = useState(clave)
  if (clave !== claveVista) {
    setClaveVista(clave)
    setValores({ min: aTexto(precio.min), max: aTexto(precio.max) })
  }

  function confirmar() {
    onConfirmar({
      ...(valores.min && { min: Number(valores.min) }),
      ...(valores.max && { max: Number(valores.max) }),
    })
  }

  return (
    <div className="filtro-precio">
      <CampoTexto
        id={`filtro-${prefijo}-min`}
        label="Desde"
        type="number"
        inputMode="numeric"
        min={limiteMin}
        max={limiteMax}
        step={1000}
        value={valores.min}
        onChange={(e) => setValores((v) => ({ ...v, min: e.target.value }))}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === 'Enter' && confirmar()}
      />
      <CampoTexto
        id={`filtro-${prefijo}-max`}
        label="Hasta"
        type="number"
        inputMode="numeric"
        min={limiteMin}
        max={limiteMax}
        step={1000}
        value={valores.max}
        onChange={(e) => setValores((v) => ({ ...v, max: e.target.value }))}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === 'Enter' && confirmar()}
      />
    </div>
  )
}
