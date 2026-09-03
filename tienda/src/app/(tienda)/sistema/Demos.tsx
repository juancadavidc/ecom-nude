'use client'

import { useState } from 'react'
import { Boton } from '@/components/ui/Button'
import { CampoLista, CampoTexto } from '@/components/ui/Field'
import { BotonTalla, Swatch } from '@/components/ui/Selectores'

/**
 * Islas cliente de la pagina de sistema. Solo existen para poder tocar los
 * componentes con estado y comprobar los estados reales — seleccionado,
 * agotado, error, cargando — sin esperar a la ficha de producto.
 */

// Colores de tela de ejemplo. Son dato de producto, no tokens de marca.
const COLORES = [
  { nombre: 'Duna', hex: '#DEB68E' },
  { nombre: 'Umber', hex: '#5C3D28' },
  { nombre: 'Arena', hex: '#EDD5B8' },
  { nombre: 'Oliva', hex: '#6F7256' },
]

const TALLAS = [
  { talla: 'XS', agotada: false },
  { talla: 'S', agotada: false },
  { talla: 'M', agotada: true },
  { talla: 'L', agotada: false },
  { talla: 'XL', agotada: false },
]

export function DemoSelectores() {
  const [color, setColor] = useState('Duna')
  const [talla, setTalla] = useState('S')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="field-label">
          Color: <span className="text-text">{color}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {COLORES.map((c) => (
            <Swatch
              key={c.nombre}
              nombre={c.nombre}
              hex={c.hex}
              seleccionado={color === c.nombre}
              onClick={() => setColor(c.nombre)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="field-label">
          Talla: <span className="text-text">{talla}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TALLAS.map((t) => (
            <BotonTalla
              key={t.talla}
              talla={t.talla}
              agotada={t.agotada}
              seleccionada={talla === t.talla}
              onClick={() => setTalla(t.talla)}
            />
          ))}
        </div>
        <p className="field-hint">
          La M esta agotada: se ve tachada, no desaparece. El estado tambien va en{' '}
          <code>aria-pressed</code> y en el <code>aria-label</code>, no solo en el color.
        </p>
      </div>
    </div>
  )
}

export function DemoFormulario() {
  const [celular, setCelular] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [cargando, setCargando] = useState(false)

  function validar() {
    // Validacion al salir del campo, no solo al enviar (SPEC §12)
    if (celular.trim().length < 10) {
      setError('Nos falta tu celular para coordinar la entrega. Son 10 digitos.')
    } else {
      setError(undefined)
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        validar()
        setCargando(true)
        window.setTimeout(() => setCargando(false), 1400)
      }}
    >
      <CampoTexto
        id="demo-nombre"
        label="Nombre completo"
        name="nombre"
        autoComplete="name"
        placeholder="Daniela Mejia"
      />
      <CampoTexto
        id="demo-celular"
        label="Celular (WhatsApp)"
        name="celular"
        // Teclado correcto en movil (SPEC §12)
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        ayuda="Te escribimos por aqui para confirmar el pedido."
        value={celular}
        onChange={(e) => setCelular(e.target.value)}
        onBlur={validar}
        error={error}
      />
      <CampoLista
        id="demo-ciudad"
        label="Ciudad"
        name="ciudad"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
      >
        <option value="">Elige tu ciudad</option>
        <option value="medellin">Medellin</option>
        <option value="envigado">Envigado</option>
        <option value="bogota">Bogota</option>
      </CampoLista>
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={cargando}>
          Confirmar pedido
        </Boton>
        <Boton type="reset" variante="secundario" onClick={() => setError(undefined)}>
          Limpiar
        </Boton>
      </div>
    </form>
  )
}
