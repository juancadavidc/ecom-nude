'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, X } from '@/components/ui/icons'
import { NOMBRE_ESTADO } from '@/lib/admin/producto-form'
import type { EstadoProducto } from '@/lib/producto-modelo'

type Opcion = { id: string; nombre: string; estado: EstadoProducto }

/** "Completa el look" de la ficha: otros productos, en el orden en que se muestran. */
export function CombinaCon({
  opciones,
  valor,
  onChange,
}: {
  opciones: Opcion[]
  valor: string[]
  onChange: (ids: string[]) => void
}) {
  const [elegido, setElegido] = useState('')
  const porId = new Map(opciones.map((o) => [o.id, o]))
  const libres = opciones.filter((o) => !valor.includes(o.id))

  function mover(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= valor.length) return
    const copia = [...valor]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    onChange(copia)
  }

  return (
    <div className="adm-campos">
      {valor.length > 0 ? (
        <ol className="adm-orden">
          {valor.map((id, i) => {
            const o = porId.get(id)
            if (!o) return null
            return (
              <li key={id}>
                <span>
                  {o.nombre}
                  {o.estado === 'borrador' && <span className="adm-muted adm-s"> (borrador: aún no se ve)</span>}
                </span>
                <button type="button" className="adm-icono" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${o.nombre}`}>
                  <ArrowUp size={18} weight="light" aria-hidden />
                </button>
                <button
                  type="button"
                  className="adm-icono"
                  onClick={() => mover(i, 1)}
                  disabled={i === valor.length - 1}
                  aria-label={`Bajar ${o.nombre}`}
                >
                  <ArrowDown size={18} weight="light" aria-hidden />
                </button>
                <button
                  type="button"
                  className="adm-icono"
                  onClick={() => onChange(valor.filter((x) => x !== id))}
                  aria-label={`Quitar ${o.nombre}`}
                >
                  <X size={18} weight="light" aria-hidden />
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="adm-muted adm-s">Sin productos sugeridos. La ficha no muestra el bloque.</p>
      )}
      <div className="adm-agregar">
        <div className="field">
          <label className="field-label" htmlFor="combina-agregar">
            Agregar producto
          </label>
          <select id="combina-agregar" className="select" value={elegido} onChange={(e) => setElegido(e.target.value)}>
            <option value="">Elige un producto</option>
            {libres.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
                {o.estado !== 'activo' ? ` (${NOMBRE_ESTADO[o.estado].toLowerCase()})` : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-secondary adm-btn-sm"
          disabled={!elegido}
          onClick={() => {
            onChange([...valor, elegido])
            setElegido('')
          }}
        >
          <Plus size={16} weight="regular" aria-hidden />
          Agregar
        </button>
      </div>
    </div>
  )
}
