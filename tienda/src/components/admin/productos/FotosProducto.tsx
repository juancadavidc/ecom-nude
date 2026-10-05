'use client'

import { useRef, useState, useTransition } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { FotoFondo } from '@/components/media/FotoFondo'
import { ArrowLeft, ArrowRight, Check, Trash, UploadSimple, Warning } from '@/components/ui/icons'
import { cambiarColorFoto, eliminarFoto, moverFoto, subirFoto } from '@/lib/admin/acciones-fotos'
import { validarArchivo } from '@/lib/admin/fotos-reglas'
import { INICIAL, type Resultado } from '@/lib/admin/resultado'
import { ANCHOS_PRODUCTO } from '@/lib/fotos'

type Foto = { id: string; color: string; ruta: string }
type Linea = { nombre: string; estado: 'espera' | 'subiendo' | 'lista' | 'error'; mensaje?: string }

/**
 * Fotos por color. Subir: tocar (celular) o arrastrar (portatil), varias a la
 * vez; se envian de a una para mostrar el avance y no pasar el limite del
 * servidor. Ordenar: flechas, que funcionan con teclado y con el dedo.
 */
export function FotosProducto({
  productoId,
  colores,
  fotos,
  alt,
}: {
  productoId: string | null
  colores: { nombre: string; hex: string }[]
  fotos: Foto[]
  alt: string
}) {
  if (!productoId) {
    return <p className="adm-muted">Crea el producto primero. Después le subes las fotos de cada color.</p>
  }
  if (!colores.length) {
    return <p className="adm-muted">Agrega un color y guarda el producto para subirle fotos.</p>
  }
  return (
    <div>
      {colores.map((c) => (
        <FotosColor
          key={c.nombre}
          productoId={productoId}
          color={c}
          otros={colores.filter((o) => o.nombre !== c.nombre).map((o) => o.nombre)}
          fotos={fotos.filter((f) => f.color === c.nombre)}
          alt={alt}
        />
      ))}
    </div>
  )
}

function FotosColor({
  productoId,
  color,
  otros,
  fotos,
  alt,
}: {
  productoId: string
  color: { nombre: string; hex: string }
  otros: string[]
  fotos: Foto[]
  alt: string
}) {
  const [arrastrando, setArrastrando] = useState(false)
  const [lineas, setLineas] = useState<Linea[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })
  const [resultado, setResultado] = useState<Resultado>(INICIAL)
  const [, iniciar] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const idInput = `subir-${color.nombre.replace(/\W+/g, '-')}`

  async function subir(lista: FileList | File[]) {
    const archivos = [...lista]
    if (!archivos.length || subiendo) return
    setResultado(INICIAL)
    setSubiendo(true)
    const estado: Linea[] = archivos.map((a) => {
      const error = validarArchivo(a.name, a.type, a.size)
      return error ? { nombre: a.name, estado: 'error', mensaje: error } : { nombre: a.name, estado: 'espera' }
    })
    setLineas([...estado])
    const total = estado.filter((l) => l.estado === 'espera').length
    let actual = 0
    for (const [i, archivo] of archivos.entries()) {
      if (estado[i].estado === 'error') continue
      setProgreso({ actual: ++actual, total })
      estado[i] = { ...estado[i], estado: 'subiendo' }
      setLineas([...estado])
      const fd = new FormData()
      fd.set('productoId', productoId)
      fd.set('color', color.nombre)
      fd.set('archivo', archivo)
      try {
        const r = await subirFoto(fd)
        estado[i] = r.ok ? { ...estado[i], estado: 'lista' } : { ...estado[i], estado: 'error', mensaje: r.mensaje }
      } catch {
        estado[i] = {
          ...estado[i],
          estado: 'error',
          mensaje: `"${archivo.name}" no llegó. Revisa la conexión e inténtalo de nuevo.`,
        }
      }
      setLineas([...estado])
    }
    setSubiendo(false)
    if (input.current) input.current.value = ''
    // Si todo salio bien, la lista de avance sobra: las fotos ya estan en la grilla.
    if (estado.every((l) => l.estado === 'lista')) {
      setLineas([])
      setResultado({
        ok: true,
        mensaje: estado.length === 1 ? 'Foto subida.' : `${estado.length} fotos subidas.`,
        t: Date.now(),
      })
    }
  }

  function ejecutar(fn: () => Promise<Resultado>) {
    iniciar(async () => setResultado(await fn()))
  }

  const pendientes = lineas.filter((l) => l.estado === 'espera' || l.estado === 'subiendo').length

  return (
    <div className="adm-fotos-color">
      <div className="adm-fotos-titulo">
        <span className="adm-swatches" aria-hidden>
          <span className="adm-swatch-grande" style={{ backgroundColor: color.hex }} />
        </span>
        <h3>{color.nombre}</h3>
        <span className="adm-muted adm-s">
          {fotos.length === 0 ? 'Sin fotos' : fotos.length === 1 ? '1 foto' : `${fotos.length} fotos`}
        </span>
      </div>

      {fotos.length > 0 && (
        <ol className="adm-fotos-grilla">
          {fotos.map((f, i) => (
            <FotoItem
              key={f.id}
              foto={f}
              posicion={i}
              total={fotos.length}
              otros={otros}
              alt={`${alt}, ${color.nombre}, foto ${i + 1}`}
              ejecutar={ejecutar}
            />
          ))}
        </ol>
      )}

      <label
        htmlFor={idInput}
        className="adm-subir"
        data-arrastrando={arrastrando}
        aria-disabled={subiendo || undefined}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          void subir(e.dataTransfer.files)
        }}
      >
        <UploadSimple size={24} weight="light" aria-hidden />
        <span className="adm-subir-titulo">
          {subiendo ? `Subiendo ${progreso.actual} de ${progreso.total}` : `Subir fotos de ${color.nombre}`}
        </span>
        <span className="adm-s adm-muted">
          {subiendo ? 'No cierres esta página.' : 'Toca para elegir o arrastra aquí. JPG, PNG o WebP, hasta 15 MB.'}
        </span>
        <input
          ref={input}
          id={idInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="visually-hidden"
          disabled={subiendo}
          onChange={(e) => e.target.files && void subir(e.target.files)}
        />
      </label>

      {lineas.length > 0 && (
        <ul className="adm-progreso" aria-live="polite">
          {lineas.map((l, i) => (
            <li key={i}>
              {l.estado === 'error' ? (
                <Warning size={16} weight="light" aria-hidden />
              ) : l.estado === 'lista' ? (
                <Check size={16} weight="regular" aria-hidden />
              ) : (
                <UploadSimple size={16} weight="light" aria-hidden />
              )}
              <span>
                {l.estado === 'error'
                  ? l.mensaje
                  : l.estado === 'lista'
                    ? `${l.nombre}: lista`
                    : l.estado === 'subiendo'
                      ? `${l.nombre}: subiendo y recortando a 3:4`
                      : `${l.nombre}: en espera`}
              </span>
            </li>
          ))}
          {!subiendo && pendientes === 0 && (
            <li>
              <button type="button" className="btn btn-secondary adm-btn-sm" onClick={() => setLineas([])}>
                Entendido
              </button>
            </li>
          )}
        </ul>
      )}

      <Aviso resultado={resultado} />
    </div>
  )
}

function FotoItem({
  foto,
  posicion,
  total,
  otros,
  alt,
  ejecutar,
}: {
  foto: Foto
  posicion: number
  total: number
  otros: string[]
  alt: string
  ejecutar: (fn: () => Promise<Resultado>) => void
}) {
  const [confirmar, setConfirmar] = useState(false)
  return (
    <li className="adm-foto">
      <div className="adm-foto-img">
        <FotoFondo nombre={foto.ruta} alt={alt} anchos={[...ANCHOS_PRODUCTO]} ancho={480} alto={640} sizes="200px" />
        {posicion === 0 && (
          <span className="adm-estado" data-estado="activo">
            Principal
          </span>
        )}
      </div>
      <div className="adm-foto-acciones">
        <button
          type="button"
          className="adm-icono"
          disabled={posicion === 0}
          onClick={() => ejecutar(() => moverFoto(foto.id, -1))}
          aria-label={`Mover la foto ${posicion + 1} antes`}
        >
          <ArrowLeft size={18} weight="light" aria-hidden />
        </button>
        <button
          type="button"
          className="adm-icono"
          disabled={posicion === total - 1}
          onClick={() => ejecutar(() => moverFoto(foto.id, 1))}
          aria-label={`Mover la foto ${posicion + 1} después`}
        >
          <ArrowRight size={18} weight="light" aria-hidden />
        </button>
        <button
          type="button"
          className="adm-icono"
          data-confirmar={confirmar}
          onClick={() => {
            if (!confirmar) {
              setConfirmar(true)
              return
            }
            ejecutar(() => eliminarFoto(foto.id))
          }}
          onBlur={() => setConfirmar(false)}
          aria-label={confirmar ? `Confirmar: borrar la foto ${posicion + 1}` : `Borrar la foto ${posicion + 1}`}
          title={confirmar ? 'Toca otra vez para borrar' : 'Borrar'}
        >
          {confirmar ? <Check size={18} weight="regular" aria-hidden /> : <Trash size={18} weight="light" aria-hidden />}
        </button>
      </div>
      {confirmar && <p className="adm-s">Toca otra vez para borrarla.</p>}
      {otros.length > 0 && (
        <>
          <label className="visually-hidden" htmlFor={`mover-${foto.id}`}>
            Mover la foto {posicion + 1} a otro color
          </label>
          <select
            id={`mover-${foto.id}`}
            className="select"
            value=""
            onChange={(e) => e.target.value && ejecutar(() => cambiarColorFoto(foto.id, e.target.value))}
          >
            <option value="">Mover a otro color</option>
            {otros.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </>
      )}
    </li>
  )
}
