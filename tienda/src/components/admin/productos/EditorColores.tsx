'use client'

import { CampoTexto } from '@/components/ui/Field'
import { CaretRight, Check, Minus, Plus, Trash, Warning } from '@/components/ui/icons'
import { NOMBRE_TALLA, TALLAS, type Talla } from '@/lib/producto-modelo'
import type { VarianteEditor } from '@/lib/admin/variantes'

export type ColorUI = {
  clave: string
  nombre: string
  hex: string
  precio: string
  codigo: string
  original: string | null
  fotos: number
}

type Props = {
  colores: ColorUI[]
  tallas: Talla[]
  variantes: VarianteEditor[]
  errores: Partial<Record<string, string>>
  onTalla: (t: Talla) => void
  onAgregar: () => void
  onCambiar: (clave: string, campo: 'nombre' | 'hex' | 'precio' | 'codigo', valor: string) => void
  onQuitar: (clave: string) => void
  onDisponible: (color: string, talla: Talla) => void
  onSku: (color: string, talla: Talla, sku: string) => void
}

/**
 * Colores, tallas y la grilla color × talla. No hay cantidades: cada
 * combinacion esta disponible o no, y eso es todo lo que se maneja.
 */
export function EditorColores({
  colores,
  tallas,
  variantes,
  errores,
  onTalla,
  onAgregar,
  onCambiar,
  onQuitar,
  onDisponible,
  onSku,
}: Props) {
  const elegidas = TALLAS.filter((t) => tallas.includes(t))
  return (
    <div className="adm-campos">
      <fieldset className="field adm-fieldset">
        <legend className="field-label adm-legend">
          Tallas
        </legend>
        <div className="adm-chips">
          {TALLAS.map((t) => (
            <button
              key={t}
              type="button"
              className="adm-chip"
              aria-pressed={tallas.includes(t)}
              onClick={() => onTalla(t)}
            >
              {NOMBRE_TALLA[t]}
            </button>
          ))}
        </div>
        {errores.tallas && <ErrorCampo texto={errores.tallas} />}
      </fieldset>

      <div className="adm-colores">
        {colores.map((c, i) => (
          <div key={c.clave} className="adm-color">
            <div className="adm-color-cabeza">
              <label className="adm-tono" title="Tono del color">
                <span style={{ backgroundColor: c.hex }} />
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => onCambiar(c.clave, 'hex', e.target.value)}
                  aria-label={`Tono de ${c.nombre || 'este color'}`}
                />
              </label>
              <CampoTexto
                id={`color-${c.clave}-nombre`}
                label="Nombre del color"
                value={c.nombre}
                placeholder="Café"
                onChange={(e) => onCambiar(c.clave, 'nombre', e.target.value)}
                error={errores[`colores.${i}.nombre`] ?? errores[`colores.${i}.hex`]}
                autoComplete="off"
              />
              <button
                type="button"
                className="adm-icono"
                onClick={() => onQuitar(c.clave)}
                disabled={c.fotos > 0}
                aria-label={c.fotos > 0 ? `${c.nombre} tiene fotos: muévelas o bórralas para quitarlo` : `Quitar ${c.nombre || 'color'}`}
                title={c.fotos > 0 ? 'Tiene fotos: muévelas o bórralas antes de quitarlo' : 'Quitar color'}
              >
                <Trash size={20} weight="light" aria-hidden />
              </button>
            </div>
            <div className="adm-color-detalle">
              <CampoTexto
                id={`color-${c.clave}-precio`}
                label="Precio de este color"
                opcional
                ayuda="Vacío: cuesta el precio base."
                inputMode="numeric"
                value={c.precio}
                placeholder="Igual al base"
                onChange={(e) => onCambiar(c.clave, 'precio', e.target.value)}
                error={errores[`colores.${i}.precio`]}
              />
              <CampoTexto
                id={`color-${c.clave}-codigo`}
                label="Código SKU"
                ayuda="Cada talla queda como CÓDIGO-TALLA."
                value={c.codigo}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => onCambiar(c.clave, 'codigo', e.target.value.toUpperCase())}
              />
            </div>
            {elegidas.length > 0 && (
              <details className="adm-skus">
                <summary>
                  <CaretRight size={14} weight="light" aria-hidden className="adm-caret" />
                  Editar el SKU de cada talla
                </summary>
                <div className="adm-skus-lista">
                  {elegidas.map((t) => {
                    const v = variantes.find((x) => x.color === c.nombre && x.talla === t)
                    if (!v) return null
                    return (
                      <CampoTexto
                        key={t}
                        id={`sku-${c.clave}-${t}`}
                        label={`Talla ${NOMBRE_TALLA[t]}`}
                        value={v.sku}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(e) => onSku(c.nombre, t, e.target.value)}
                      />
                    )
                  })}
                </div>
              </details>
            )}
            {c.fotos > 0 && (
              <p className="adm-s adm-muted">
                {c.fotos === 1 ? 'Tiene una foto.' : `Tiene ${c.fotos} fotos.`}
              </p>
            )}
          </div>
        ))}
        {errores.colores && <ErrorCampo texto={errores.colores} />}
        <div>
          <button type="button" className="btn btn-secondary adm-btn-sm" onClick={onAgregar}>
            <Plus size={16} weight="regular" aria-hidden />
            Agregar color
          </button>
        </div>
      </div>

      {colores.length > 0 && elegidas.length > 0 && (
        <div className="field">
          <p className="field-label" id="grilla-titulo">
            Disponibilidad
          </p>
          <p className="field-hint">Toca una casilla para marcar esa talla como agotada o disponible.</p>
          <div className="adm-grilla-scroll">
            <table className="adm-grilla" aria-labelledby="grilla-titulo">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Color</span>
                  </th>
                  {elegidas.map((t) => (
                    <th key={t} scope="col">
                      {NOMBRE_TALLA[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colores.map((c) => (
                  <tr key={c.clave}>
                    <th scope="row">
                      <span className="adm-grilla-color">
                        <span className="adm-swatches" aria-hidden>
                          <span style={{ backgroundColor: c.hex }} />
                        </span>
                        {c.nombre || 'Sin nombre'}
                      </span>
                    </th>
                    {elegidas.map((t) => {
                      const v = variantes.find((x) => x.color === c.nombre && x.talla === t)
                      const disponible = v?.disponible ?? true
                      return (
                        <td key={t}>
                          <button
                            type="button"
                            className="adm-celda"
                            aria-pressed={disponible}
                            aria-label={`${c.nombre || 'Color'} talla ${NOMBRE_TALLA[t]}: ${disponible ? 'disponible' : 'agotada'}`}
                            onClick={() => onDisponible(c.nombre, t)}
                          >
                            {disponible ? (
                              <Check size={18} weight="regular" aria-hidden />
                            ) : (
                              <Minus size={18} weight="light" aria-hidden />
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errores.variantes && <ErrorCampo texto={errores.variantes} />}
        </div>
      )}
    </div>
  )
}

export function ErrorCampo({ texto }: { texto: string }) {
  return (
    <p className="field-error adm-error-suelto" role="alert">
      <Warning size={16} weight="light" aria-hidden />
      <span>{texto}</span>
    </p>
  )
}
