import { tipoDeClave } from './claves'
import { usarR2 } from './env'
import { almacenLocal } from './local'
import { almacenR2 } from './r2'
import type { Almacen } from './tipos'

export { esClaveSegura, tipoDeClave } from './claves'
export type { Almacen, Objeto } from './tipos'

/** El almacen activo. Se decide en cada llamada para que los tests puedan cambiar el entorno. */
export function almacen(): Almacen {
  return usarR2() ? almacenR2 : almacenLocal
}

/**
 * Responde una foto del almacen. Las claves nunca cambian de contenido
 * (reemplazar una foto es subir otra con otro nombre), asi que se cachea un ano
 * y se marca inmutable.
 */
export async function servirObjeto(clave: string): Promise<Response> {
  const objeto = await almacen().leer(clave)
  if (!objeto) return new Response('No encontrada', { status: 404 })
  const headers: Record<string, string> = {
    'Content-Type': objeto.tipo ?? tipoDeClave(clave),
    'Cache-Control': 'public, max-age=31536000, immutable',
  }
  if (objeto.largo !== null) headers['Content-Length'] = String(objeto.largo)
  return new Response(objeto.cuerpo as BodyInit, { headers })
}
