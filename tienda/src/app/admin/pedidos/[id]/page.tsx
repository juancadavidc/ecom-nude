import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EstadoPedidoBadge } from '@/components/admin/Estado'
import { Miniatura } from '@/components/admin/Miniatura'
import { CambiarEstado, FormGuia, FormNotas } from '@/components/admin/pedidos/FormulariosPedido'
import { ArrowLeft, Info, WhatsappLogo } from '@/components/ui/icons'
import { obtenerPedido } from '@/lib/admin/datos'
import { fechaLarga } from '@/lib/admin/fecha'
import { enlaceWhatsApp, motivoBloqueo, NOMBRE_METODO, siguientesEstados } from '@/lib/admin/pedidos-estado'
import { formatCOP } from '@/lib/format'
import { NOMBRE_TALLA, esTalla } from '@/lib/producto-modelo'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await obtenerPedido((await params).id)
  return { title: r ? `Pedido #${r.pedido.numero}` : 'Pedido' }
}

export default async function PedidoPage({ params }: Props) {
  const r = await obtenerPedido((await params).id)
  if (!r) notFound()
  const { pedido: p, items } = r
  const siguientes = siguientesEstados(p)
  // Por que todavia no se puede despachar, dicho antes de que lo intente.
  const bloqueoEnvio =
    ['nuevo', 'confirmado', 'pagado'].includes(p.estado) && !siguientes.includes('enviado')
      ? motivoBloqueo(p, 'enviado')
      : null
  const unidades = items.reduce((s, i) => s + i.cantidad, 0)

  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <Link href="/admin/pedidos" className="adm-volver">
            <ArrowLeft size={16} weight="light" aria-hidden />
            Pedidos
          </Link>
          <h1 className="adm-num">Pedido #{p.numero}</h1>
          <p className="adm-prod-meta">
            <EstadoPedidoBadge estado={p.estado} />
            <span>{fechaLarga(p.creadoEn)}</span>
          </p>
        </div>
        <a
          className="btn btn-secondary adm-btn-sm"
          href={enlaceWhatsApp(p)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsappLogo size={18} weight="light" aria-hidden />
          Escribirle por WhatsApp
        </a>
      </div>

      <div className="adm-detalle">
        <div className="adm-bloque">
          <h2>
            {unidades === 1 ? '1 prenda' : `${unidades} prendas`}
          </h2>
          <ul className="adm-items">
            {items.map((i) => (
              <li key={i.id} className="adm-item">
                <Miniatura ruta={i.imagen || null} alt="" />
                <div>
                  {i.categoria ? (
                    <Link href={`/${i.categoria}/${i.productoSlug}`} target="_blank" className="link">
                      {i.nombre}
                    </Link>
                  ) : (
                    <p>{i.nombre}</p>
                  )}
                  <p className="adm-s adm-muted">
                    {i.color}, talla {esTalla(i.talla) ? NOMBRE_TALLA[i.talla] : i.talla}
                  </p>
                  <p className="adm-s adm-muted adm-num">
                    SKU {i.sku}, {i.cantidad} × {formatCOP(i.precio)}
                  </p>
                </div>
                <p className="adm-num">{formatCOP(i.precio * i.cantidad)}</p>
              </li>
            ))}
          </ul>
          <dl className="adm-totales adm-num">
            <dt>Subtotal</dt>
            <dd>{formatCOP(p.subtotal)}</dd>
            <dt>Envío</dt>
            <dd>{formatCOP(p.envio)}</dd>
            {p.descuento > 0 && (
              <>
                <dt>Descuento{p.codigoDescuento ? ` (${p.codigoDescuento})` : ''}</dt>
                <dd>-{formatCOP(p.descuento)}</dd>
              </>
            )}
            <dt className="adm-total">Total</dt>
            <dd className="adm-total">{formatCOP(p.total)}</dd>
          </dl>
          <p className="adm-s adm-muted">
            Pago: {NOMBRE_METODO[p.metodoPago].toLowerCase()}
            {p.metodoPago === 'contraentrega' ? `. La clienta paga ${formatCOP(p.total)} en efectivo al recibir.` : '.'}
          </p>
        </div>

        <div>
          <section className="adm-bloque" aria-labelledby="sec-estado">
            <h2 id="sec-estado">Estado</h2>
            {siguientes.length === 0 ? (
              <p className="adm-muted adm-s">Este pedido ya se entregó. No hay más pasos.</p>
            ) : (
              <CambiarEstado id={p.id} siguientes={siguientes} />
            )}
            {bloqueoEnvio && (
              <p className="adm-nota-regla">
                <Info size={16} weight="light" aria-hidden />
                <span>{bloqueoEnvio}</span>
              </p>
            )}
          </section>

          <section className="adm-bloque" aria-labelledby="sec-envio">
            <h2 id="sec-envio">Entrega</h2>
            <div className="adm-datos">
              <p>{p.nombre}</p>
              <p>
                <a href={`tel:${p.celular.replace(/\s/g, '')}`} className="adm-num">
                  {p.celular}
                </a>
              </p>
              <p>
                <a href={`mailto:${p.correo}`}>{p.correo}</a>
              </p>
            </div>
            <div className="adm-datos">
              <p>{p.direccion}</p>
              {p.barrio && <p>Barrio {p.barrio}</p>}
              <p>
                {p.ciudad}, {p.departamento}
              </p>
              {p.indicaciones && <p className="adm-muted">{p.indicaciones}</p>}
            </div>
            <FormGuia id={p.id} guia={p.guia ?? ''} />
          </section>

          <section className="adm-bloque" aria-labelledby="sec-notas">
            <h2 id="sec-notas" className="visually-hidden">
              Notas internas
            </h2>
            <FormNotas id={p.id} notas={p.notasInternas} />
          </section>
        </div>
      </div>
    </>
  )
}
