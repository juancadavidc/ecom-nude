/**
 * Lo que devuelve toda accion del panel. `t` cambia en cada respuesta para que
 * el cliente pueda volver a mostrar el aviso aunque el mensaje sea el mismo.
 */
export type Resultado = {
  ok: boolean
  mensaje: string
  errores?: Partial<Record<string, string>>
  t: number
}

export const INICIAL: Resultado = { ok: false, mensaje: '', t: 0 }

export function exito(mensaje: string): Resultado {
  return { ok: true, mensaje, t: Date.now() }
}

export function fallo(mensaje: string, errores?: Partial<Record<string, string>>): Resultado {
  return { ok: false, mensaje, errores, t: Date.now() }
}
