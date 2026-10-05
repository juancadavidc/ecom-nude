import type { Metadata } from 'next'
import Link from 'next/link'
import { EstadoPedidoBadge } from '@/components/admin/Estado'
import { listarPedidos, resumenPedidos } from '@/lib/admin/datos'
import { fechaCorta } from '@/lib/admin/fecha'
import { esEstadoPedido, ESTADOS_PEDIDO, NOMBRE_ESTADO_PEDIDO, NOMBRE_METODO } from '@/lib/admin/pedidos-estado'
import { formatCOP } from '@/lib/format'

export const metadata: Metadata = { title: 'Pedidos' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function PedidosPage({ searchParams }: Props) {
  const sp = await searchParams
  const crudo = Array.isArray(sp.estado) ? sp.estado[0] : sp.estado
  const estado = esEstadoPedido(crudo) ? crudo : undefined
  const [pedidos, resumen] = await Promise.all([listarPedidos(estado), resumenPedidos()])

  const pendientes = resumen.nuevo + resumen.confirmado + resumen.pagado

  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <h1>Pedidos</h1>
          <p className="adm-muted adm-s">
            {pendientes === 0
              ? 'Nada pendiente por despachar.'
              : `${pendientes} ${pendientes === 1 ? 'pedido pendiente' : 'pedidos pendientes'} por despachar.`}
          </p>
        </div>
      </div>

      <nav className="adm-segmentos" aria-label="Filtrar por estado">
        <Link href="/admin/pedidos" className="adm-segmento" aria-current={!estado ? 'page' : undefined}>
          Todos <span className="adm-num adm-muted">{resumen.todos}</span>
        </Link>
        {ESTADOS_PEDIDO.map((e) => (
          <Link
            key={e}
            href={`/admin/pedidos?estado=${e}`}
            className="adm-segmento"
            aria-current={estado === e ? 'page' : undefined}
          >
            {NOMBRE_ESTADO_PEDIDO[e]} <span className="adm-num adm-muted">{resumen[e]}</span>
          </Link>
        ))}
      </nav>

      {pedidos.length === 0 ? (
        <div className="adm-vacio">
          <p>
            {estado
              ? `No hay pedidos en estado ${NOMBRE_ESTADO_PEDIDO[estado].toLowerCase()}.`
              : 'Todavía no llega ningún pedido. Cuando una clienta confirme su compra, aparece aquí.'}
          </p>
        </div>
      ) : (
        <>
          <div className="adm-pedidos-cabeza" aria-hidden>
            <span>Pedido</span>
            <span>Fecha</span>
            <span>Clienta</span>
            <span>Ciudad</span>
            <span>Pago</span>
            <span>Total</span>
            <span>Estado</span>
          </div>
          <ul className="adm-lista">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/pedidos/${p.id}`} className="adm-pedido">
                  {/* Celular: dos lineas que se leen de un vistazo. */}
                  <span className="adm-pedido-movil">
                    <span className="adm-pedido-num adm-num">#{p.numero}</span> {p.nombre}
                  </span>
                  <span className="adm-pedido-movil adm-pedido-total adm-num">{formatCOP(p.total)}</span>
                  <span className="adm-pedido-movil adm-pedido-meta">
                    {p.ciudad}, {NOMBRE_METODO[p.metodoPago].toLowerCase()}, {fechaCorta(p.creadoEn)}
                  </span>
                  <span className="adm-pedido-movil adm-pedido-estado">
                    <EstadoPedidoBadge estado={p.estado} />
                  </span>
                  {/* Escritorio: columnas. */}
                  <span className="adm-pedido-escritorio adm-pedido-num adm-num">#{p.numero}</span>
                  <span className="adm-pedido-escritorio adm-s adm-num">{fechaCorta(p.creadoEn)}</span>
                  <span className="adm-pedido-escritorio">{p.nombre}</span>
                  <span className="adm-pedido-escritorio">{p.ciudad}</span>
                  <span className="adm-pedido-escritorio adm-s">{NOMBRE_METODO[p.metodoPago]}</span>
                  <span className="adm-pedido-escritorio adm-num">{formatCOP(p.total)}</span>
                  <span className="adm-pedido-escritorio">
                    <EstadoPedidoBadge estado={p.estado} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
