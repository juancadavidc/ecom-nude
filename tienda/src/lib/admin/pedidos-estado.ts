/**
 * Ciclo de vida de un pedido en el panel. Logica pura.
 *
 * SPEC §4.5: el contra entrega devuelve muchos pedidos y cada devolucion paga
 * flete de ida y vuelta. El control es operativo: un pedido contra entrega se
 * confirma por WhatsApp ANTES de despacharlo. Aqui eso es una regla, no un
 * consejo: `enviado` solo se alcanza desde `confirmado`.
 *
 * Por transferencia lo equivalente es el comprobante: no se despacha hasta
 * marcar el pago como recibido (`pagado`).
 */

export const ESTADOS_PEDIDO = ['nuevo', 'confirmado', 'pagado', 'enviado', 'entregado', 'cancelado'] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]
export type MetodoPago = 'transferencia' | 'contraentrega'

export const NOMBRE_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  nuevo: 'Nuevo',
  confirmado: 'Confirmado',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  transferencia: 'Transferencia',
  contraentrega: 'Contra entrega',
}

/** Verbo del boton que lleva a cada estado. */
export const ACCION_ESTADO: Record<EstadoPedido, string> = {
  nuevo: 'Reabrir pedido',
  confirmado: 'Marcar confirmado',
  pagado: 'Marcar pago recibido',
  enviado: 'Marcar enviado',
  entregado: 'Marcar entregado',
  cancelado: 'Cancelar pedido',
}

const SIGUIENTES: Record<EstadoPedido, EstadoPedido[]> = {
  nuevo: ['confirmado', 'pagado', 'cancelado'],
  confirmado: ['pagado', 'enviado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: ['nuevo'],
}

const ANTES_DE_ENVIAR: EstadoPedido[] = ['nuevo', 'confirmado', 'pagado']

export function esEstadoPedido(v: unknown): v is EstadoPedido {
  return typeof v === 'string' && (ESTADOS_PEDIDO as readonly string[]).includes(v)
}

/** null si el cambio se puede hacer; si no, por que no y como seguir. */
export function motivoBloqueo(
  pedido: { estado: EstadoPedido; metodoPago: MetodoPago },
  nuevo: EstadoPedido,
): string | null {
  const { estado, metodoPago } = pedido
  if (estado === nuevo) return 'El pedido ya está en ese estado.'
  if (metodoPago === 'contraentrega' && nuevo === 'pagado') {
    return 'En contra entrega el pago se recibe al entregar: marca el pedido como entregado.'
  }
  if (nuevo === 'enviado' && ANTES_DE_ENVIAR.includes(estado) && metodoPago === 'contraentrega' && estado !== 'confirmado') {
    return 'Un pedido contra entrega se confirma con la clienta por WhatsApp antes de enviarlo.'
  }
  if (nuevo === 'enviado' && ANTES_DE_ENVIAR.includes(estado) && metodoPago === 'transferencia' && estado !== 'pagado') {
    return 'Marca el pago como recibido antes de enviarlo.'
  }
  if (!SIGUIENTES[estado].includes(nuevo)) {
    return `Un pedido ${NOMBRE_ESTADO_PEDIDO[estado].toLowerCase()} no puede pasar a ${NOMBRE_ESTADO_PEDIDO[nuevo].toLowerCase()}.`
  }
  return null
}

/** Los estados a los que se puede pasar desde el actual, en orden del ciclo. */
export function siguientesEstados(pedido: { estado: EstadoPedido; metodoPago: MetodoPago }): EstadoPedido[] {
  return ESTADOS_PEDIDO.filter((e) => motivoBloqueo(pedido, e) === null)
}

/** Solo digitos, con el 57 de Colombia delante si es un celular de 10 digitos. */
export function celularInternacional(celular: string): string {
  const digitos = celular.replace(/\D/g, '')
  if (digitos.length === 10 && digitos.startsWith('3')) return `57${digitos}`
  return digitos
}

export function enlaceWhatsApp(pedido: { celular: string; numero: number; nombre: string }): string {
  const primerNombre = pedido.nombre.trim().split(/\s+/)[0] ?? ''
  const mensaje = `Hola ${primerNombre}, te escribimos de NUDE por tu pedido #${pedido.numero}.`
  return `https://wa.me/${celularInternacional(pedido.celular)}?text=${encodeURIComponent(mensaje)}`
}
