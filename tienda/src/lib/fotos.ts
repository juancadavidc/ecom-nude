/**
 * Donde vive una foto de producto. Hay dos origenes y una sola forma de pedirlas:
 *
 *   "p/enterizo-corto-1"  catalogo inicial: generada por scripts/gen-catalogo.mjs
 *                         en semilla/fotos, subida al almacen (R2) con
 *                         `npm run fotos:subir` y servida por app/fotos/p/[archivo]
 *   "/media/<id>"         subida desde el panel al almacen (R2) y servida por
 *                         app/media/[archivo]/route.ts
 *
 * Las dos existen en los mismos anchos y formatos, asi que `FotoFondo` no
 * necesita saber de cual se trata. Las fotos de sitio (home, comunidad,
 * placeholder) si son estaticas en public/fotos: son parte del diseño, no del
 * catalogo.
 */

/** Anchos de toda foto de producto. 3:4, asi que el alto es ancho * 4/3. */
export const ANCHOS_PRODUCTO = [480, 960] as const
export const FORMATOS = ['avif', 'webp', 'jpg'] as const
export type Formato = (typeof FORMATOS)[number]

export function baseFoto(nombre: string): string {
  return nombre.startsWith('/') ? nombre : `/fotos/${nombre}`
}

export function urlFoto(nombre: string, ancho: number, formato: Formato = 'jpg'): string {
  return `${baseFoto(nombre)}-${ancho}.${formato}`
}
