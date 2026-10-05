import { NOMBRE_ESTADO } from '@/lib/admin/producto-form'
import { NOMBRE_ESTADO_PEDIDO, type EstadoPedido } from '@/lib/admin/pedidos-estado'
import type { EstadoProducto } from '@/lib/producto-modelo'

export function EstadoProductoBadge({ estado }: { estado: EstadoProducto }) {
  return (
    <span className="adm-estado" data-estado={estado}>
      {NOMBRE_ESTADO[estado]}
    </span>
  )
}

export function EstadoPedidoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span className="adm-estado" data-estado={estado}>
      {NOMBRE_ESTADO_PEDIDO[estado]}
    </span>
  )
}
