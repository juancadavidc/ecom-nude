/**
 * Genera las fotos de producto del catalogo a partir de las fotos de la sesion.
 *
 *   node scripts/gen-catalogo.mjs <carpeta-con-las-fotos>
 *
 * Fuente:  la carpeta del zip de la sesion (catalogonude-*.zip), ya pasada a JPG
 * Mapa:    scripts/catalogo-fotos.json  ({ salida, fuente, tratamiento })
 * Salida:  public/fotos/<salida>-<ancho>.<avif|webp|jpg>, siempre en 3:4
 *
 * Las fotos llegaron como llegaron: cuadros de video con el icono de sonido
 * del celular, collages de tres poses, flatlays horizontales. La tienda las
 * pide todas en 3:4 (SPEC §6), asi que cada una pasa por un tratamiento:
 *
 *   auto  Si la proporcion esta entre 0.6 y 0.9 (un retrato de celular de
 *         1070x1600, por ejemplo), recorte con `attention`: sharp busca la
 *         zona con mas detalle — la prenda, no la pared — y se pierde a lo
 *         sumo un quinto de la foto. Si no, la foto entera va sobre
 *         un paspartu Cream: un collage de tres poses o un flatlay horizontal
 *         no pierden ninguna pose ni prenda. Se probo extender con el color de
 *         los bordes de la foto y daba franjas turbias (rojizas en el collage
 *         rojo, grises en los de borde negro); el Cream de la marca se lee como
 *         decision, no como relleno.
 *   mute  Primero tapa el icono de sonido (abajo a la derecha) con un parche
 *         del piso que esta justo a su izquierda, con borde difuminado. Luego
 *         sigue como `auto`.
 *
 * Los productos sin foto no pasan por aqui: quedan en borrador hasta que se
 * les suba una desde el panel.
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../public/fotos')
const SRC = process.argv[2]
if (!SRC || !existsSync(SRC)) {
  console.error('Uso: node scripts/gen-catalogo.mjs <carpeta-con-las-fotos>')
  process.exit(1)
}

/** Los mismos dos anchos que `ANCHOS_PRODUCTO` en src/lib/fotos.ts. */
const ANCHOS = [480, 960]
const CALIDAD = { avif: 50, webp: 70, jpeg: 78 }
const RATIO = 3 / 4

const manifiesto = JSON.parse(readFileSync(resolve(here, 'catalogo-fotos.json'), 'utf8'))

/** `--cream` de SPEC §2.1. */
const PASPARTU = { r: 0xf6, g: 0xeb, b: 0xde }

async function taparIcono(buf, w, h) {
  // El icono es un circulo de ~70px a ~75px de la esquina inferior derecha en
  // los cuadros de 1200px de ancho. Se escala con el ancho por si acaso.
  const k = w / 1205
  const radio = Math.round(55 * k)
  const cx = Math.round(w - 75 * k)
  const cy = Math.round(h - 75 * k)
  const lado = radio * 2
  const parche = await sharp(buf)
    .extract({ left: cx - radio - Math.round(150 * k), top: cy - radio, width: lado, height: lado })
    .toBuffer()
  const mascara = Buffer.from(
    `<svg width="${lado}" height="${lado}"><defs><radialGradient id="g">` +
      `<stop offset="70%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>` +
      `</radialGradient></defs><circle cx="${radio}" cy="${radio}" r="${radio}" fill="url(#g)"/></svg>`,
  )
  const suave = await sharp(parche)
    .ensureAlpha()
    .composite([{ input: mascara, blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(buf)
    .composite([{ input: suave, left: cx - radio, top: cy - radio }])
    .jpeg({ quality: 95 })
    .toBuffer()
}

async function a34(buf) {
  const { width: w, height: h } = await sharp(buf).metadata()
  const r = w / h
  if (r >= 0.6 && r <= 0.9) {
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

mkdirSync(resolve(OUT, 'p'), { recursive: true })

for (const { salida, fuente, tratamiento } of manifiesto) {
  let buf = await sharp(resolve(SRC, fuente)).rotate().jpeg({ quality: 95 }).toBuffer()
  const { width, height } = await sharp(buf).metadata()
  if (tratamiento === 'mute') buf = await taparIcono(buf, width, height)
  buf = await a34(buf)

  for (const w of ANCHOS) {
    const base = sharp(buf).resize({ width: w, height: Math.round(w / RATIO), fit: 'cover' })
    await base.clone().avif({ quality: CALIDAD.avif }).toFile(`${OUT}/${salida}-${w}.avif`)
    await base.clone().webp({ quality: CALIDAD.webp }).toFile(`${OUT}/${salida}-${w}.webp`)
    await base.clone().jpeg({ quality: CALIDAD.jpeg, mozjpeg: true }).toFile(`${OUT}/${salida}-${w}.jpg`)
  }
  console.log(`${salida}  <-  ${fuente}  (${tratamiento}, ${width}x${height})`)
}
