'use server'

import { redirect } from 'next/navigation'
import { leerConfig } from '@/lib/config'
import { checkoutCopy } from '@/lib/copy'
import { MENSAJES } from '@/lib/pedido-modelo'
import { cotizarItems, crearPedido, porcentajeDeCodigo, type LineaCotizada, type ResultadoPedido } from '@/lib/pedidos'

/**
 * Las tres llamadas del checkout al servidor. Son endpoints publicos: todo lo que
 * llega se trata como desconocido y lo limpia `src/lib/pedidos.ts`.
 */

/** Relee el carrito contra la base: precio real, foto, y si cada linea se puede comprar. */
export async function revisarCarrito(items: unknown): Promise<LineaCotizada[]> {
  return cotizarItems(items)
}

export type ResultadoCodigo = { ok: true; codigo: string; porcentaje: number } | { ok: false; mensaje: string }

/**
 * Valida el codigo en el servidor: la lista de codigos nunca viaja al cliente,
 * o cualquiera los leeria en el HTML.
 */
export async function validarCodigo(codigo: unknown): Promise<ResultadoCodigo> {
  const limpio = typeof codigo === 'string' ? codigo.trim().toUpperCase().slice(0, 40) : ''
  if (!limpio) return { ok: false, mensaje: checkoutCopy.codigoVacio }
  const porcentaje = porcentajeDeCodigo(limpio, await leerConfig())
  return porcentaje ? { ok: true, codigo: limpio, porcentaje } : { ok: false, mensaje: MENSAJES.codigoInvalido }
}

export type ResultadoConfirmar = Extract<ResultadoPedido, { ok: false }>

/**
 * Crea el pedido y lleva a la confirmacion. Si algo falla devuelve los errores
 * por campo y por linea; los valores escritos no se pierden porque el
 * formulario es controlado y no se reinicia.
 *
 * `redirect` va fuera del try: lanza a proposito y no debe tragarse.
 */
export async function confirmarPedido(entrada: { campos: unknown; items: unknown; codigo: unknown }): Promise<ResultadoConfirmar> {
  let resultado: ResultadoPedido
  try {
    resultado = await crearPedido({ campos: entrada?.campos, items: entrada?.items, codigo: entrada?.codigo })
  } catch (error) {
    console.error('[checkout] no se pudo crear el pedido', error)
    return { ok: false, errores: {}, erroresItems: {}, mensaje: checkoutCopy.errorGeneral }
  }
  if (!resultado.ok) return resultado
  redirect(`/pedido/${resultado.id}?nuevo=1`)
}
