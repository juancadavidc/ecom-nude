'use client'

import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { BotonEnviar } from '@/components/admin/BotonEnviar'
import { CampoArea, CampoLista, CampoTexto } from '@/components/ui/Field'
import { guardarProducto } from '@/lib/admin/acciones-productos'
import type { ProductoPanel } from '@/lib/admin/datos'
import { detallesDeTexto, ESTADOS_PRODUCTO, motivoSinFotos, NOMBRE_ESTADO, seoPorDefecto } from '@/lib/admin/producto-form'
import { INICIAL } from '@/lib/admin/resultado'
import {
  cambiarCodigo,
  codigoPorDefecto,
  renombrarColor,
  sincronizarVariantes,
  type VarianteEditor,
} from '@/lib/admin/variantes'
import { slugificar, TALLAS, type EstadoProducto, type Talla } from '@/lib/producto-modelo'
import { CombinaCon } from './CombinaCon'
import { Warning } from '@/components/ui/icons'
import { EditorColores, type ColorUI as ColorEditorUI } from './EditorColores'

type ColorUI = Omit<ColorEditorUI, 'fotos'>

type Props = {
  producto: ProductoPanel | null
  categorias: { slug: string; nombre: string }[]
  opciones: { id: string; nombre: string; estado: EstadoProducto }[]
  /** Fotos guardadas por color (nombre en la base). */
  fotosPorColor: Record<string, number>
  /** La seccion de fotos: va entre colores y publicacion, pero no es parte de este formulario. */
  fotos: ReactNode
  /** Acciones de archivar y eliminar. */
  peligro?: ReactNode
}


const soloDigitos = (s: string) => s.replace(/[.\s$]/g, '')

export function FormProducto({ producto, categorias, opciones, fotosPorColor, fotos, peligro }: Props) {
  const nuevo = producto === null
  const [estadoAccion, accion] = useActionState(guardarProducto, INICIAL)
  const errores = estadoAccion.errores ?? {}

  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [slug, setSlug] = useState(producto?.slug ?? '')
  const [slugTocado, setSlugTocado] = useState(!nuevo)
  const [categoria, setCategoria] = useState(producto?.categoria ?? '')
  const [marca, setMarca] = useState(producto?.marca ?? '')
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [detalles, setDetalles] = useState((producto?.detalles ?? []).join('\n'))
  const [estado, setEstado] = useState<EstadoProducto>(producto?.estado ?? 'borrador')
  const [destacado, setDestacado] = useState(producto?.destacado ?? false)
  const [seo, setSeo] = useState(producto?.seo ?? { titulo: '', descripcion: '', alt: '' })
  const [seoTocado, setSeoTocado] = useState(!nuevo)
  const [tallas, setTallas] = useState<Talla[]>(producto?.tallas ?? ['S', 'M', 'L'])
  const [colores, setColores] = useState<ColorUI[]>(
    (producto?.colores ?? []).map((c, i) => ({
      // Clave estable entre servidor y cliente: un contador global daria otra en cada lado.
      clave: `g${i}`,
      nombre: c.nombre,
      hex: c.hex,
      precio: c.precio == null ? '' : String(c.precio),
      codigo: c.codigo,
      original: c.original,
    })),
  )
  const [variantes, setVariantes] = useState<VarianteEditor[]>(producto?.variantes ?? [])
  const [combina, setCombina] = useState<string[]>(producto?.combinaCon ?? [])
  const [sucio, setSucio] = useState(false)
  const [siguienteClave, setSiguienteClave] = useState(0)

  const totalFotos = Object.values(fotosPorColor).reduce((a, b) => a + b, 0)
  const categoriaNombre = categorias.find((c) => c.slug === categoria)?.nombre ?? ''
  const seoEfectivo = seoTocado ? seo : seoPorDefecto(nombre, descripcion, categoriaNombre)
  const slugEfectivo = slugTocado ? slug : slugificar(nombre)

  // Guardado: los colores quedan con su nombre nuevo como "original". Se ajusta
  // durante el render (no en un efecto) cuando llega una respuesta nueva.
  const [respuestaVista, setRespuestaVista] = useState(estadoAccion.t)
  if (estadoAccion.t !== respuestaVista) {
    setRespuestaVista(estadoAccion.t)
    if (estadoAccion.ok) {
      setColores((cs) => cs.map((c) => ({ ...c, original: c.nombre })))
      setSucio(false)
    }
  }

  // Con errores, el foco va al primer campo marcado.
  useEffect(() => {
    if (!estadoAccion.t || estadoAccion.ok || !estadoAccion.errores) return
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('.adm-form [aria-invalid="true"], .adm-form [role="alert"]')
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      if (el?.matches('input, select, textarea')) el.focus({ preventScroll: true })
    })
  }, [estadoAccion])

  // Aviso del navegador si se sale con cambios sin guardar.
  useEffect(() => {
    if (!sucio) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio])

  function marcar<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v)
      setSucio(true)
    }
  }

  function sincronizar(cs: ColorUI[], ts: Talla[], vs: VarianteEditor[]) {
    setVariantes(sincronizarVariantes(cs, ts, vs))
  }

  function alternarTalla(t: Talla) {
    const ts = tallas.includes(t) ? tallas.filter((x) => x !== t) : TALLAS.filter((x) => x === t || tallas.includes(x))
    setTallas(ts)
    sincronizar(colores, ts, variantes)
    setSucio(true)
  }

  function agregarColor() {
    const usados = colores.map((c) => c.codigo)
    setSiguienteClave((n) => n + 1)
    const c: ColorUI = {
      clave: `n${siguienteClave}`,
      nombre: '',
      hex: '#d8c2a8',
      precio: '',
      codigo: codigoPorDefecto(slugEfectivo || nombre, `color${colores.length + 1}`, usados),
      original: null,
    }
    const cs = [...colores, c]
    setColores(cs)
    sincronizar(cs, tallas, variantes)
    setSucio(true)
    requestAnimationFrame(() => document.getElementById(`color-${c.clave}-nombre`)?.focus())
  }

  function cambiarColor(clave: string, campo: 'nombre' | 'hex' | 'precio' | 'codigo', valor: string) {
    const actual = colores.find((c) => c.clave === clave)
    if (!actual) return
    let vs = variantes
    let cambio: Partial<ColorUI> = { [campo]: valor }
    if (campo === 'nombre') {
      vs = renombrarColor(vs, actual.nombre, valor)
      // Un color nuevo con el codigo por defecto lo actualiza con el nombre.
      if (!actual.original) {
        const otros = colores.filter((c) => c.clave !== clave).map((c) => c.codigo)
        const codigo = codigoPorDefecto(slugEfectivo || nombre, valor || 'color', otros)
        vs = cambiarCodigo(vs, valor, actual.codigo, codigo)
        cambio = { ...cambio, codigo }
      }
    }
    if (campo === 'codigo') vs = cambiarCodigo(vs, actual.nombre, actual.codigo, valor)
    const cs = colores.map((c) => (c.clave === clave ? { ...c, ...cambio } : c))
    setColores(cs)
    sincronizar(cs, tallas, vs)
    setSucio(true)
  }

  function quitarColor(clave: string) {
    const cs = colores.filter((c) => c.clave !== clave)
    setColores(cs)
    sincronizar(cs, tallas, variantes)
    setSucio(true)
  }

  function alternarDisponible(color: string, talla: Talla) {
    setVariantes((vs) => vs.map((v) => (v.color === color && v.talla === talla ? { ...v, disponible: !v.disponible } : v)))
    setSucio(true)
  }

  function cambiarSku(color: string, talla: Talla, sku: string) {
    setVariantes((vs) => vs.map((v) => (v.color === color && v.talla === talla ? { ...v, sku } : v)))
    setSucio(true)
  }

  const datos = useMemo(
    () =>
      JSON.stringify({
        nombre,
        slug: slugEfectivo,
        categoria,
        marca,
        precio: soloDigitos(precio),
        descripcion,
        detalles: detallesDeTexto(detalles),
        estado,
        destacado,
        seo: seoEfectivo,
        colores: colores.map((c) => ({
          nombre: c.nombre.trim(),
          hex: c.hex,
          precio: soloDigitos(c.precio) || null,
          codigo: c.codigo,
          original: c.original,
        })),
        tallas,
        variantes: variantes.map((v) => ({ ...v, color: v.color.trim() })),
        combinaCon: combina,
      }),
    [nombre, slugEfectivo, categoria, marca, precio, descripcion, detalles, estado, destacado, seoEfectivo, colores, tallas, variantes, combina],
  )

  const sinFotosActivo = estado === 'activo' && totalFotos === 0

  return (
    <div className="adm-form">
      <section className="adm-seccion" aria-labelledby="sec-info">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-info">Información</h2>
          <p className="adm-s adm-muted">Lo que la clienta lee en la ficha.</p>
        </div>
        <div className="adm-campos">
          <CampoTexto
            id="nombre"
            label="Nombre"
            value={nombre}
            onChange={(e) => marcar(setNombre)(e.target.value)}
            error={errores.nombre}
            placeholder="Legging Rib tiro alto"
            autoComplete="off"
          />
          <div className="field">
            <label className="field-label" htmlFor="slug">
              Dirección web
            </label>
            <p className="field-hint" id="slug-ayuda">
              {nuevo
                ? 'Se arma sola con el nombre. Puedes cambiarla.'
                : 'Si la cambias, los enlaces que ya compartiste dejan de funcionar.'}
            </p>
            <div className="adm-prefijo">
              <span>/{categoria || 'categoria'}/</span>
              <input
                id="slug"
                className="input"
                value={slugEfectivo}
                onChange={(e) => {
                  setSlugTocado(true)
                  marcar(setSlug)(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }}
                aria-invalid={errores.slug ? true : undefined}
                aria-describedby={errores.slug ? 'slug-ayuda slug-error' : 'slug-ayuda'}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {errores.slug && (
              <p className="field-error" id="slug-error" role="alert">
                <Warning size={16} weight="light" aria-hidden />
                <span>{errores.slug}</span>
              </p>
            )}
          </div>
          <div className="adm-fila">
            <CampoLista
              id="categoria"
              label="Categoría"
              value={categoria}
              onChange={(e) => marcar(setCategoria)(e.target.value)}
              error={errores.categoria}
            >
              <option value="">Elige una categoría</option>
              {categorias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </CampoLista>
            <CampoTexto
              id="marca"
              label="Marca o proveedor"
              opcional
              ayuda="Solo la ves tú. Nunca sale en la tienda."
              value={marca}
              onChange={(e) => marcar(setMarca)(e.target.value)}
              autoComplete="off"
            />
          </div>
          <CampoTexto
            id="precio"
            label="Precio base"
            ayuda="En pesos, sin puntos. Un color puede costar más, nunca menos."
            inputMode="numeric"
            value={precio}
            onChange={(e) => marcar(setPrecio)(e.target.value)}
            error={errores.precio}
            placeholder="145000"
            className="adm-precio"
          />
          <CampoArea
            id="descripcion"
            label="Descripción"
            value={descripcion}
            onChange={(e) => marcar(setDescripcion)(e.target.value)}
            error={errores.descripcion}
            rows={4}
          />
          <CampoArea
            id="detalles"
            label="Detalles"
            opcional
            ayuda="Uno por línea: tela, tiro, largo, cierre."
            value={detalles}
            onChange={(e) => marcar(setDetalles)(e.target.value)}
            rows={4}
          />
        </div>
      </section>

      <section className="adm-seccion" aria-labelledby="sec-colores">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-colores">Colores y tallas</h2>
          <p className="adm-s adm-muted">Cada color se vende en las tallas elegidas. Marca lo que se agote.</p>
        </div>
        <EditorColores
          colores={colores.map((c) => ({ ...c, fotos: c.original ? (fotosPorColor[c.original] ?? 0) : 0 }))}
          tallas={tallas}
          variantes={variantes}
          errores={errores}
          onTalla={alternarTalla}
          onAgregar={agregarColor}
          onCambiar={cambiarColor}
          onQuitar={quitarColor}
          onDisponible={alternarDisponible}
          onSku={cambiarSku}
        />
      </section>

      <section className="adm-seccion" aria-labelledby="sec-fotos">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-fotos">Fotos</h2>
          <p className="adm-s adm-muted">Por color. La primera es la que sale en el catálogo.</p>
        </div>
        <div className="adm-campos">{fotos}</div>
      </section>

      <section className="adm-seccion" aria-labelledby="sec-publicacion">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-publicacion">Publicación</h2>
          <p className="adm-s adm-muted">Un borrador no se ve en la tienda.</p>
        </div>
        <div className="adm-campos">
          <CampoLista
            id="estado"
            label="Estado"
            value={estado}
            onChange={(e) => marcar(setEstado)(e.target.value as EstadoProducto)}
            error={errores.estado ?? (sinFotosActivo ? motivoSinFotos() : undefined)}
            ayuda={totalFotos === 0 ? 'Sin fotos solo puede quedar en borrador, agotado o próximamente.' : undefined}
          >
            {ESTADOS_PRODUCTO.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </CampoLista>
          <label className="adm-interruptor">
            <input type="checkbox" checked={destacado} onChange={(e) => marcar(setDestacado)(e.target.checked)} />
            Destacar en la home
          </label>
        </div>
      </section>

      <section className="adm-seccion" aria-labelledby="sec-combina">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-combina">Combina con</h2>
          <p className="adm-s adm-muted">Sale al final de la ficha como &ldquo;Completa el look&rdquo;.</p>
        </div>
        <CombinaCon
          opciones={opciones}
          valor={combina}
          onChange={(ids) => {
            setCombina(ids)
            setSucio(true)
          }}
        />
      </section>

      <section className="adm-seccion" aria-labelledby="sec-seo">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-seo">Buscadores</h2>
          <p className="adm-s adm-muted">
            {seoTocado ? 'Cómo aparece en Google.' : 'Se llenan solos con el nombre y la descripción.'}
          </p>
        </div>
        <div className="adm-campos">
          <CampoTexto
            id="seo-titulo"
            label="Título"
            value={seoEfectivo.titulo}
            onChange={(e) => {
              setSeoTocado(true)
              marcar(setSeo)({ ...seoEfectivo, titulo: e.target.value })
            }}
            error={errores['seo.titulo']}
          />
          <CampoArea
            id="seo-descripcion"
            label="Descripción"
            ayuda={`${seoEfectivo.descripcion.length} de 160 caracteres recomendados.`}
            value={seoEfectivo.descripcion}
            onChange={(e) => {
              setSeoTocado(true)
              marcar(setSeo)({ ...seoEfectivo, descripcion: e.target.value })
            }}
            error={errores['seo.descripcion']}
            rows={3}
          />
          <CampoTexto
            id="seo-alt"
            label="Texto alternativo de las fotos"
            ayuda="Para quien no ve la foto: prenda, color y tela."
            value={seoEfectivo.alt}
            onChange={(e) => {
              setSeoTocado(true)
              marcar(setSeo)({ ...seoEfectivo, alt: e.target.value })
            }}
            error={errores['seo.alt']}
          />
        </div>
      </section>

      {peligro && (
        <section className="adm-seccion" aria-labelledby="sec-peligro">
          <div className="adm-seccion-cabeza">
            <h2 id="sec-peligro">Archivar o eliminar</h2>
          </div>
          {peligro}
        </section>
      )}

      <form action={accion} className="adm-guardar">
        {producto && <input type="hidden" name="id" value={producto.id} />}
        <input type="hidden" name="datos" value={datos} />
        {estadoAccion.mensaje ? (
          <Aviso resultado={estadoAccion} />
        ) : sucio ? (
          <p className="adm-s adm-muted adm-pendiente">Hay cambios sin guardar.</p>
        ) : null}
        <BotonEnviar>{nuevo ? 'Crear producto' : 'Guardar cambios'}</BotonEnviar>
      </form>
    </div>
  )
}
