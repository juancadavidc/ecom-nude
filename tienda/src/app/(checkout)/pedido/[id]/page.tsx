import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Miniatura } from '@/components/checkout/Miniatura'
import { VaciarCarrito } from '@/components/checkout/VaciarCarrito'
import { BotonLink } from '@/components/ui/Button'
import { WhatsappLogo } from '@/components/ui/icons'
import { leerConfig } from '@/lib/config'
import { checkoutCopy as copy } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import { primerNombre } from '@/lib/pedido-modelo'
import { obtenerPedido, type PedidoConfirmado } from '@/lib/pedidos'

/**
 * Confirmacion del pedido (SPEC §4.5).
 *
 * Que datos personales muestra, y por que: el enlace es un UUID, imposible de
 * adivinar, pero un enlace se reenvia, se pega en un chat, queda en el
 * historial de un computador compartido. Por eso esta pagina muestra solo lo
 * que la clienta necesita para pagar y reconocer su pedido: su primer nombre,
 * la ciudad de entrega y los ultimos cuatro digitos del celular (para que sepa
 * a que numero le vamos a escribir y corrija si se equivoco). La direccion,
 * el barrio y el correo no salen nunca de la base hacia esta pagina — ver
 * `obtenerPedido`, que ni siquiera los consulta. Minimo necesario, como pide
 * la Ley 1581 de tratamiento de datos.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pedido recibido',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string }> }

function enlaceWhatsapp(numero: string, texto: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export default async function PedidoPage({ params }: Props) {
  const { id } = await params
  const [pedido, cfg] = await Promise.all([obtenerPedido(id), leerConfig()])
  if (!pedido) notFound()

  const nombre = primerNombre(pedido.nombre)
  const cuentas = cfg.datosPago.cuentas
  const transferencia = pedido.metodoPago === 'transferencia'

  const mensajeWhatsapp = transferencia
    ? cuentas.length
      ? `Hola, soy ${nombre}. Te envío el comprobante del pedido #${pedido.numero} por ${formatCOP(pedido.total)}.`
      : `Hola, soy ${nombre}. Hice el pedido #${pedido.numero} por ${formatCOP(pedido.total)} y voy a pagar por transferencia. ¿Me envías los datos de la cuenta?`
    : `Hola, soy ${nombre}. Quiero confirmar el pedido #${pedido.numero} por ${formatCOP(pedido.total)}, pago contra entrega en ${pedido.ciudad}.`

  return (
    <div className="container-nude co-pagina co-confirmacion">
      <VaciarCarrito skus={pedido.items.map((i) => i.sku)} />

      <header className="co-conf-cabeza">
        <h1 className="display-l">{copy.recibido}</h1>
        <p className="body co-conf-numero">
          Gracias, {nombre}. Tu pedido es el <strong>#{pedido.numero}</strong> y va para {pedido.ciudad},{' '}
          {pedido.departamento}.
        </p>
      </header>

      <section className="co-conf-pago on-sahara" aria-labelledby="co-h-pago">
        {transferencia ? (
          <>
            <h2 className="co-h2" id="co-h-pago">
              {copy.transfiereExacto}
            </h2>
            <p className="co-monto">{formatCOP(pedido.total)}</p>
            {cuentas.length ? (
              <ul className="co-cuentas">
                {cuentas.map((c) => (
                  <li key={`${c.banco}-${c.numero}`} className="co-cuenta">
                    <p className="co-cuenta-banco">
                      {c.banco}
                      {c.tipo && <span>, {c.tipo.toLowerCase()}</span>}
                    </p>
                    <p className="co-cuenta-numero">{c.numero}</p>
                    <p className="co-cuenta-titular">A nombre de {c.titular}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="body">{copy.sinCuentas}</p>
            )}
            <p className="body-s">
              Escribe el número de pedido <strong>#{pedido.numero}</strong> en la descripción de la transferencia.{' '}
              {copy.despachoTransferencia}
            </p>
            <a
              className="btn btn-primary btn-block co-whatsapp"
              href={enlaceWhatsapp(cfg.whatsapp, mensajeWhatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappLogo size={20} weight="light" aria-hidden="true" />
              <span>{cuentas.length ? copy.enviarComprobante : copy.pedirDatos}</span>
            </a>
          </>
        ) : (
          <>
            <h2 className="co-h2" id="co-h-pago">
              {copy.llega}
            </h2>
            <p className="body-s co-monto-label">{copy.efectivoListo}</p>
            <p className="co-monto">{formatCOP(pedido.total)}</p>
            <p className="body">{copy.confirmacionContraentrega}</p>
            <a
              className="btn btn-primary btn-block co-whatsapp"
              href={enlaceWhatsapp(cfg.whatsapp, mensajeWhatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappLogo size={20} weight="light" aria-hidden="true" />
              <span>{copy.confirmarWhatsapp}</span>
            </a>
          </>
        )}
        <p className="body-s co-conf-celular">
          Te escribimos al celular terminado en {pedido.celular.slice(-4)}.
        </p>
      </section>

      <Resumen pedido={pedido} />

      <p className="quote co-conf-bienvenida">{copy.bienvenida}</p>

      <BotonLink href="/colecciones" variante="secundario" className="co-conf-seguir">
        {copy.seguirViendo}
      </BotonLink>
    </div>
  )
}

function Resumen({ pedido }: { pedido: PedidoConfirmado }) {
  return (
    <section className="co-conf-resumen" aria-labelledby="co-h-resumen">
      <h2 className="co-h2" id="co-h-resumen">
        {copy.resumen}
      </h2>
      <ul className="co-items">
        {pedido.items.map((i) => (
          <li key={i.sku} className="co-item">
            <Miniatura imagen={i.imagen} hex={i.hex} color={i.color} />
            <div className="co-item-info">
              <p className="co-item-nombre">{i.nombre}</p>
              <p className="co-item-variante">
                {i.color}, talla {i.talla}
                {i.cantidad > 1 && <>, {i.cantidad} unidades</>}
              </p>
            </div>
            <p className="co-item-precio">{formatCOP(i.precio * i.cantidad)}</p>
          </li>
        ))}
      </ul>
      <dl className="co-totales">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCOP(pedido.subtotal)}</dd>
        </div>
        {pedido.descuento > 0 && (
          <div>
            <dt>Descuento {pedido.codigoDescuento}</dt>
            <dd>-{formatCOP(pedido.descuento)}</dd>
          </div>
        )}
        <div>
          <dt>
            Envío<span className="co-totales-nota"> a {pedido.ciudad}</span>
          </dt>
          <dd>{formatCOP(pedido.envio)}</dd>
        </div>
        <div className="co-total">
          <dt>Total</dt>
          <dd>{formatCOP(pedido.total)}</dd>
        </div>
      </dl>
      <p className="body-s co-conf-metodo">
        {pedido.metodoPago === 'transferencia' ? 'Pago por transferencia.' : 'Pago contra entrega, en efectivo.'}
      </p>
    </section>
  )
}
