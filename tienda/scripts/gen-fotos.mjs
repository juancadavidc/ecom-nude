/**
 * Genera las variantes web de la fotografia a partir de los originales.
 *
 *   node scripts/gen-fotos.mjs
 *
 * Fuente:  ../assets/fotos/*.png|jpg   (original de camara, sin tocar)
 * Salida:  public/fotos/<nombre>-<ancho>.<avif|webp|jpg>
 *
 * Por que un script y no `next/image`: `next.config.ts` exporta estatico
 * (`output: 'export'`) y Firebase Hosting no corre el optimizador de Next, asi
 * que `<Image>` serviria el PNG crudo — 1,2 MB en el primer pantallazo. Aqui el
 * trabajo se hace una vez, en build local, y el resultado se versiona: el
 * navegador recibe AVIF/WebP con srcset y el JPG queda de red de seguridad.
 *
 * El ancho maximo no sube de la resolucion del original: reescalar hacia arriba
 * pesa mas y no anade un solo detalle. Si llega una foto mas grande, ANCHOS se
 * recorta solo.
 */
import { readdirSync, mkdirSync, statSync } from 'node:fs'
import { dirname, extname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(here, '../../assets/fotos')
const OUT = resolve(here, '../public/fotos')

/** Los cortes del srcset. Cubren movil @2x, portatil y pantalla grande. */
const ANCHOS = [768, 1024, 1366, 1920]

/** Calidad por formato. AVIF aguanta mas compresion que WebP a igual ojo. */
const CALIDAD = { avif: 52, webp: 72, jpeg: 80 }

mkdirSync(OUT, { recursive: true })

const fuentes = readdirSync(SRC).filter((f) => /\.(png|jpe?g|tiff?)$/i.test(f))
if (fuentes.length === 0) throw new Error(`No hay originales en ${SRC}`)

for (const archivo of fuentes) {
  const nombre = basename(archivo, extname(archivo))
  const entrada = `${SRC}/${archivo}`
  const { width, height } = await sharp(entrada).metadata()

  // Nunca se pasa del ancho real; el ultimo corte es siempre el original.
  const anchos = [...new Set([...ANCHOS.filter((w) => w < width), width])]

  for (const w of anchos) {
    // `fit: inside` sin `withoutEnlargement` sobra: ya filtramos por ancho.
    const base = sharp(entrada).resize({ width: w })
    await base.clone().avif({ quality: CALIDAD.avif }).toFile(`${OUT}/${nombre}-${w}.avif`)
    await base.clone().webp({ quality: CALIDAD.webp }).toFile(`${OUT}/${nombre}-${w}.webp`)
    await base
      .clone()
      .jpeg({ quality: CALIDAD.jpeg, mozjpeg: true })
      .toFile(`${OUT}/${nombre}-${w}.jpg`)
  }

  const kb = (f) => `${Math.round(statSync(`${OUT}/${f}`).size / 1024)} kB`
  const mayor = anchos.at(-1)
  console.log(
    `${nombre}  ${width}x${height}  ->  ${anchos.join(', ')}px` +
      `   (${mayor}px: avif ${kb(`${nombre}-${mayor}.avif`)}` +
      ` · webp ${kb(`${nombre}-${mayor}.webp`)}` +
      ` · jpg ${kb(`${nombre}-${mayor}.jpg`)})`,
  )
}
