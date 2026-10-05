'use client'

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react'
import { confirmarPedido, revisarCarrito, validarCodigo } from '@/app/(checkout)/checkout/acciones'
import { MarcaNude } from '@/components/brand/Logo'
import { useCarrito } from '@/components/carrito/CarritoProvider'
import { Boton, BotonLink } from '@/components/ui/Button'
import { CampoArea, CampoLista, CampoTexto } from '@/components/ui/Field'
import { Warning } from '@/components/ui/icons'
import { DEPARTAMENTOS, municipiosDe } from '@/lib/colombia'
import { checkoutCopy as copy } from '@/lib/copy'
import { cx, formatCOP } from '@/lib/format'
import {
  CAMPOS_VACIOS,
  ORDEN_CAMPOS,
  descuentoConPorcentaje,
  totalDe,
  validarCampo,
  validarPedido,
  type CampoPedido,
  type CamposPedido,
  type ErroresCampos,
} from '@/lib/pedido-modelo'
import type { LineaCotizada } from '@/lib/pedidos'
import { Miniatura } from './Miniatura'
import { OpcionesPago } from './OpcionesPago'

export type PropsCheckout = {
  tarifas: { metro: number; nacional: number }
  /**
   * Municipios de `colombia.ts` que pagan tarifa metropolitana. Los calcula el
   * servidor con `envioPara`, así cliente y servidor cobran lo mismo sin que el
   * cliente tenga que conocer la regla.
   */
  ciudadesMetro: string[]
}

/**
 * SPEC §4.5 — una sola página, cuatro bloques. El carrito vive en localStorage,
 * así que esta parte es cliente; lo que se cobra lo decide el servidor.
 */
export function Checkout(props: PropsCheckout) {
  const { items } = useCarrito()
  const listo = useCarritoHidratado()

  if (!items.length) {
    if (!listo) return <div className="co-cargando" aria-busy="true" />
    return (
      <div className="co-vacio">
        <MarcaNude alto={44} className="text-line" />
        <p className="quote">{copy.vacioTexto}</p>
        <BotonLink href="/colecciones" variante="secundario">
          {copy.vacioBoton}
        </BotonLink>
      </div>
    )
  }
  return <FormularioCheckout {...props} />
}

/**
 * El proveedor del carrito carga localStorage en un efecto, y los efectos del
 * padre corren después de los del hijo: en el primer render el carrito siempre
 * parece vacío. Un tick después ya está cargado. Sin esto, quien recarga el
 * checkout vería un instante "Todavía no has elegido nada."
 */
function useCarritoHidratado() {
  const [listo, setListo] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setListo(true), 0)
    return () => clearTimeout(t)
  }, [])
  return listo
}

const ID = (campo: CampoPedido | 'codigo') => `co-${campo}`

function FormularioCheckout({ tarifas, ciudadesMetro }: PropsCheckout) {
  const { items, subtotal: subtotalCarrito, eliminar } = useCarrito()
  const [valores, setValores] = useState<CamposPedido>(CAMPOS_VACIOS)
  const [errores, setErrores] = useState<ErroresCampos>({})
  const [erroresItems, setErroresItems] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [enviando, iniciarEnvio] = useTransition()

  // --- Lo que dice el servidor del carrito ---------------------------------
  const llaveItems = items.map((i) => `${i.sku}:${i.cantidad}`).join('|')
  const [cotizacion, setCotizacion] = useState<{ llave: string; lineas: LineaCotizada[] } | null>(null)
  useEffect(() => {
    let vigente = true
    revisarCarrito(items.map(({ sku, cantidad }) => ({ sku, cantidad })))
      .then((lineas) => vigente && setCotizacion({ llave: llaveItems, lineas }))
      .catch(() => {
        // Sin cotización se muestran los datos del carrito; el servidor igual
        // recalcula todo al confirmar.
      })
    return () => {
      vigente = false
    }
    // `items` cambia de identidad en cada render del proveedor; la llave no.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llaveItems])
  const lineasServidor = useMemo(
    () => new Map((cotizacion?.lineas ?? []).map((l) => [l.sku, l])),
    [cotizacion],
  )

  const lineas = items.map((i) => {
    const s = lineasServidor.get(i.sku)
    return {
      sku: i.sku,
      nombre: s?.nombre || i.nombre,
      color: s?.color || i.color,
      talla: s?.talla || i.talla,
      precio: s && !s.problema ? s.precio : i.precio,
      cantidad: i.cantidad,
      imagen: s ? s.imagen : i.imagen,
      hex: s?.hex ?? '',
      problema: s?.problema ?? erroresItems[i.sku] ?? null,
    }
  })
  const cotizado = cotizacion?.llave === llaveItems
  const subtotal = cotizado
    ? lineas.reduce((s, l) => s + (l.problema ? 0 : l.precio * l.cantidad), 0)
    : subtotalCarrito
  const hayProblemas = lineas.some((l) => l.problema)

  // --- Envío, descuento, total ---------------------------------------------
  const metro = useMemo(() => new Set(ciudadesMetro), [ciudadesMetro])
  const envio = valores.ciudad
    ? metro.has(`${valores.departamento}|${valores.ciudad}`)
      ? tarifas.metro
      : tarifas.nacional
    : null
  const [codigoTexto, setCodigoTexto] = useState('')
  const [codigo, setCodigo] = useState<{ codigo: string; porcentaje: number } | null>(null)
  const [aplicando, iniciarAplicar] = useTransition()
  const descuento = codigo ? descuentoConPorcentaje(subtotal, codigo.porcentaje) : 0
  const total = envio === null ? null : totalDe({ subtotal, envio, descuento })

  // --- Campos --------------------------------------------------------------
  function cambiar(campo: CampoPedido, valor: string) {
    const siguiente = { ...valores, [campo]: valor }
    if (campo === 'departamento') siguiente.ciudad = ''
    setValores(siguiente)
    // Un error que ya se mostró se re-evalúa al escribir, para que desaparezca
    // en cuanto queda bien; uno que no se ha mostrado espera al blur.
    setErrores((e) => {
      const n = { ...e }
      if (n[campo]) n[campo] = validarCampo(campo, siguiente)
      if (campo === 'departamento') delete n.ciudad
      // Elegir en un select o un radio es una decisión terminada: se valida ya.
      if (campo === 'ciudad' || campo === 'metodoPago') n[campo] = validarCampo(campo, siguiente)
      return n
    })
    if (mensaje) setMensaje(null)
  }

  function salir(campo: CampoPedido) {
    // Un campo que nunca se tocó no se marca al pasar de largo por él con Tab.
    if (!valores[campo] && !errores[campo]) return
    setErrores((e) => ({ ...e, [campo]: validarCampo(campo, valores) }))
  }

  const propsCampo = (campo: CampoPedido) => ({
    id: ID(campo),
    name: campo,
    value: valores[campo],
    error: errores[campo],
    onBlur: () => salir(campo),
  })

  // --- Código de descuento -------------------------------------------------
  function aplicarCodigo() {
    iniciarAplicar(async () => {
      const r = await validarCodigo(codigoTexto).catch(() => null)
      if (r?.ok) {
        setCodigo({ codigo: r.codigo, porcentaje: r.porcentaje })
        setCodigoTexto(r.codigo)
        setErrores((e) => ({ ...e, codigo: undefined }))
      } else {
        setCodigo(null)
        setErrores((e) => ({ ...e, codigo: r ? r.mensaje : copy.errorGeneral }))
      }
    })
  }

  function quitarCodigo() {
    setCodigo(null)
    setCodigoTexto('')
    setErrores((e) => ({ ...e, codigo: undefined }))
  }

  // --- Confirmar -----------------------------------------------------------
  function enfocarPrimerError(e: ErroresCampos) {
    const primero = [...ORDEN_CAMPOS, 'codigo' as const].find((c) => e[c])
    if (primero) document.getElementById(ID(primero))?.focus()
  }

  function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    const v = validarPedido(valores)
    if (!v.ok) {
      setErrores((e) => ({ ...e, ...v.errores }))
      setMensaje(copy.revisarCampos)
      enfocarPrimerError(v.errores)
      return
    }
    if (hayProblemas) {
      setMensaje('Hay productos que ya no se pueden comprar. Quítalos del pedido para seguir.')
      return
    }
    setMensaje(null)
    iniciarEnvio(async () => {
      let r: Awaited<ReturnType<typeof confirmarPedido>> | undefined
      try {
        r = await confirmarPedido({
          campos: valores,
          items: items.map(({ sku, cantidad }) => ({ sku, cantidad })),
          codigo: codigo?.codigo ?? '',
        })
      } catch {
        setMensaje(copy.errorGeneral)
        return
      }
      // Si salió bien, el servidor ya redirigió a la confirmación.
      if (!r) return
      setErrores(r.errores)
      setErroresItems(r.erroresItems)
      if (r.errores.codigo) setCodigo(null)
      setMensaje(r.mensaje ?? (Object.keys(r.errores).length ? copy.revisarCampos : null))
      enfocarPrimerError(r.errores)
    })
  }

  const municipios = municipiosDe(valores.departamento)

  return (
    <form className="co-grid" onSubmit={confirmar} noValidate aria-busy={enviando || undefined}>
      <div className="co-bloques">
        <h1 className="title co-titulo">{copy.titulo}</h1>

        <section className="co-bloque" aria-labelledby="co-h-contacto">
          <h2 className="co-h2" id="co-h-contacto">
            {copy.contacto}
          </h2>
          <div className="co-campos">
            <CampoTexto
              {...propsCampo('nombre')}
              label="Nombre completo"
              autoComplete="name"
              maxLength={120}
              className="co-ancho"
              onChange={(e) => cambiar('nombre', e.target.value)}
            />
            <CampoTexto
              {...propsCampo('celular')}
              label="Celular (WhatsApp)"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="300 123 4567"
              maxLength={20}
              ayuda={copy.contactoNota}
              onChange={(e) => cambiar('celular', e.target.value)}
            />
            <CampoTexto
              {...propsCampo('correo')}
              label="Correo"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={160}
              ayuda="Ahí te llega la confirmación del pedido."
              onChange={(e) => cambiar('correo', e.target.value)}
            />
          </div>
        </section>

        <section className="co-bloque" aria-labelledby="co-h-entrega">
          <h2 className="co-h2" id="co-h-entrega">
            {copy.entrega}
          </h2>
          <div className="co-campos">
            <CampoLista
              {...propsCampo('departamento')}
              label="Departamento"
              autoComplete="address-level1"
              onChange={(e) => cambiar('departamento', e.target.value)}
            >
              <option value="">Elige un departamento</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d.nombre} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </CampoLista>
            <CampoLista
              {...propsCampo('ciudad')}
              label="Ciudad o municipio"
              autoComplete="address-level2"
              disabled={!valores.departamento}
              onChange={(e) => cambiar('ciudad', e.target.value)}
            >
              <option value="">{valores.departamento ? 'Elige la ciudad' : 'Primero el departamento'}</option>
              {municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </CampoLista>
            <p className="co-envio-aviso co-ancho" aria-live="polite">
              {envio === null ? (
                'El envío se calcula al elegir la ciudad.'
              ) : (
                <>
                  Envío a {valores.ciudad}: <strong>{formatCOP(envio)}</strong>.{' '}
                  {envio === tarifas.metro && tarifas.metro !== tarifas.nacional
                    ? 'Tarifa de área metropolitana.'
                    : 'Llega en 2 a 4 días hábiles.'}
                </>
              )}
            </p>
            <CampoTexto
              {...propsCampo('direccion')}
              label="Dirección"
              autoComplete="address-line1"
              placeholder="Calle 10 # 43-21, apto 502"
              maxLength={200}
              className="co-ancho"
              onChange={(e) => cambiar('direccion', e.target.value)}
            />
            <CampoTexto
              {...propsCampo('barrio')}
              label="Barrio"
              autoComplete="address-level3"
              maxLength={120}
              className="co-ancho"
              onChange={(e) => cambiar('barrio', e.target.value)}
            />
            <CampoArea
              {...propsCampo('indicaciones')}
              label="Indicaciones para la entrega"
              opcional
              rows={3}
              maxLength={300}
              placeholder="Portería, casa de rejas blancas, horario en que hay alguien"
              className="co-ancho co-indicaciones"
              onChange={(e) => cambiar('indicaciones', e.target.value)}
            />
          </div>
        </section>

        <section className="co-bloque" aria-labelledby="co-h-pago">
          <h2 className="co-h2" id="co-h-pago">
            {copy.pago}
          </h2>
          <OpcionesPago
            valor={valores.metodoPago}
            error={errores.metodoPago}
            onCambio={(v) => cambiar('metodoPago', v)}
          />
        </section>
      </div>

      <aside className="co-resumen on-sahara" aria-labelledby="co-h-resumen">
        <h2 className="co-h2" id="co-h-resumen">
          {copy.resumen}
        </h2>

        <ul className="co-items">
          {lineas.map((l) => (
            <li key={l.sku} className={cx('co-item', l.problema && 'co-item-problema')}>
              <Miniatura imagen={l.imagen} hex={l.hex} color={l.color} />
              <div className="co-item-info">
                <p className="co-item-nombre">{l.nombre}</p>
                <p className="co-item-variante">
                  {l.color}, talla {l.talla}
                  {l.cantidad > 1 && <>, {l.cantidad} unidades</>}
                </p>
              </div>
              <p className="co-item-precio">{formatCOP(l.precio * l.cantidad)}</p>
              {l.problema && (
                <div className="co-item-aviso" role="alert">
                  <p className="field-error">
                    <Warning size={16} weight="light" />
                    <span>{l.problema}</span>
                  </p>
                  <button type="button" className="co-quitar link" onClick={() => eliminar(l.sku)}>
                    {copy.quitar}
                    <span className="sr-only"> {l.nombre}</span>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="co-codigo">
          {codigo ? (
            <div className="co-codigo-aplicado">
              <p>
                <strong>{codigo.codigo}</strong> aplicado: {codigo.porcentaje} % menos en tus prendas.
              </p>
              <button type="button" className="co-quitar link" onClick={quitarCodigo}>
                {copy.codigoQuitar}
              </button>
            </div>
          ) : (
            <div className="field">
              <label className="field-label" htmlFor={ID('codigo')}>
                {copy.codigoLabel}
                <span className="field-optional"> (opcional)</span>
              </label>
              <div className="co-codigo-fila">
                <input
                  id={ID('codigo')}
                  className="input"
                  value={codigoTexto}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={40}
                  aria-invalid={errores.codigo ? true : undefined}
                  aria-describedby={errores.codigo ? 'co-codigo-error' : undefined}
                  onChange={(e) => {
                    setCodigoTexto(e.target.value)
                    if (errores.codigo) setErrores((x) => ({ ...x, codigo: undefined }))
                  }}
                  onKeyDown={(e) => {
                    // Enter aquí aplica el código; no confirma el pedido entero.
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      aplicarCodigo()
                    }
                  }}
                />
                <Boton type="button" variante="secundario" cargando={aplicando} onClick={aplicarCodigo}>
                  {copy.codigoAplicar}
                </Boton>
              </div>
              {errores.codigo && (
                <p className="field-error" id="co-codigo-error" role="alert">
                  <Warning size={16} weight="light" />
                  <span>{errores.codigo}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <dl className="co-totales">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCOP(subtotal)}</dd>
          </div>
          {codigo && descuento > 0 && (
            <div>
              <dt>Descuento {codigo.codigo}</dt>
              <dd>-{formatCOP(descuento)}</dd>
            </div>
          )}
          <div>
            <dt>Envío{valores.ciudad && <span className="co-totales-nota"> a {valores.ciudad}</span>}</dt>
            <dd>{envio === null ? <span className="co-totales-nota">{copy.envioElegirCiudad}</span> : formatCOP(envio)}</dd>
          </div>
          <div className="co-total" aria-live="polite" aria-atomic="true">
            <dt>Total</dt>
            <dd>{total === null ? <span className="co-totales-nota">Con la ciudad sabes el total exacto.</span> : formatCOP(total)}</dd>
          </div>
        </dl>

        <Boton type="submit" ancho cargando={enviando}>
          {copy.confirmar}
        </Boton>
        {mensaje && (
          <p className="field-error co-mensaje" role="alert">
            <Warning size={16} weight="light" />
            <span>{mensaje}</span>
          </p>
        )}
      </aside>
    </form>
  )
}
