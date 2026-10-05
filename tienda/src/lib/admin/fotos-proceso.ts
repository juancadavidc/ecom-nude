import sharp from 'sharp'
import { ANCHOS_PRODUCTO, type Formato } from '@/lib/fotos'
import { esHeic, MENSAJE_HEIC } from './fotos-reglas'

export { MAX_BYTES, validarArchivo } from './fotos-reglas'

/**
 * Procesa una foto subida desde el panel con la misma regla que
 * `scripts/gen-catalogo.mjs` (mantenerlas identicas):
 *
 *   1. `.rotate()` aplica la orientacion EXIF (las fotos del celular vienen
 *      giradas en los metadatos, no en los pixeles).
 *   2. A 3:4. Si la proporcion ancho/alto esta entre 0.6 y 0.9 se recorta con
 *      `attention` (sharp busca la prenda, no la pared). Fuera de ese rango
 *      —collages de tres poses (~0.53), flatlays horizontales (>= 1)— la foto
 *      entera va sobre un paspartu Cream para no perder ninguna pose.
 *   3. Anchos 480 y 960 en AVIF, WebP y JPG (mozjpeg).
 */

const RATIO = 3 / 4
const CALIDAD = { avif: 50, webp: 70, jpeg: 78 }
/** `--cream` de SPEC §2.1. */
const PASPARTU = { r: 0xf6, g: 0xeb, b: 0xde }

export type MedioProcesado = { ancho: number; formato: Formato; datos: Buffer }

export class ErrorFoto extends Error {}

export function decidirTratamiento(ancho: number, alto: number): 'recorte' | 'paspartu' {
  const r = ancho / alto
  return r >= 0.6 && r <= 0.9 ? 'recorte' : 'paspartu'
}

async function a34(buf: Buffer): Promise<Buffer> {
  const { width: w = 0, height: h = 0 } = await sharp(buf).metadata()
  if (decidirTratamiento(w, h) === 'recorte') {
    const alto = Math.min(h, Math.round(w / RATIO))
    const ancho = Math.round(alto * RATIO)
    return sharp(buf).resize(ancho, alto, { fit: 'cover', position: sharp.strategy.attention }).toBuffer()
  }
  // Lienzo 3:4 que contiene la foto entera, con un margen minimo del 3%.
  const alto = Math.round(Math.max(h, w / RATIO) * 1.03)
  const ancho = Math.round(alto * RATIO)
  const top = Math.round((alto - h) / 2)
  const left = Math.round((ancho - w) / 2)
  return sharp(buf)
    .extend({ top, bottom: alto - h - top, left, right: ancho - w - left, background: PASPARTU })
    .toBuffer()
}

/**
 * De bytes subidos a los seis archivos que sirve `/media/<id>-<ancho>.<formato>`.
 * Lanza `ErrorFoto` con un mensaje para Daniela si la foto no se puede leer.
 */
export async function procesarFoto(
  entrada: Buffer,
  { nombre = 'La foto', tipo = '' }: { nombre?: string; tipo?: string } = {},
): Promise<MedioProcesado[]> {
  let base: Buffer
  try {
    const meta = await sharp(entrada).metadata()
    if (!meta.format || !['jpeg', 'png', 'webp', 'heif'].includes(meta.format)) {
      throw new ErrorFoto(`"${nombre}" no es una foto JPG, PNG o WebP. Elige otra.`)
    }
    base = await sharp(entrada).rotate().jpeg({ quality: 95 }).toBuffer()
  } catch (e) {
    if (e instanceof ErrorFoto) throw e
    if (esHeic(nombre, tipo)) throw new ErrorFoto(MENSAJE_HEIC)
    throw new ErrorFoto(`No pudimos leer "${nombre}". Puede estar dañada o en un formato raro: prueba con un JPG.`)
  }

  const recortada = await a34(base)
  const salida: MedioProcesado[] = []
  for (const w of ANCHOS_PRODUCTO) {
    const img = sharp(recortada).resize({ width: w, height: Math.round(w / RATIO), fit: 'cover' })
    salida.push({ ancho: w, formato: 'avif', datos: await img.clone().avif({ quality: CALIDAD.avif }).toBuffer() })
    salida.push({ ancho: w, formato: 'webp', datos: await img.clone().webp({ quality: CALIDAD.webp }).toBuffer() })
    salida.push({
      ancho: w,
      formato: 'jpg',
      datos: await img.clone().jpeg({ quality: CALIDAD.jpeg, mozjpeg: true }).toBuffer(),
    })
  }
  return salida
}
