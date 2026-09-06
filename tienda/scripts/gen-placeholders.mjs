/**
 * Marcas de posicion de fotografia de producto: fondo plano de la paleta con el
 * isotipo centrado.
 *
 *   node scripts/gen-placeholders.mjs
 *
 * Son DESECHABLES. Existen para poder verificar el cruce a la segunda foto de la
 * card y las miniaturas de la galeria; en cuanto haya sesion de producto real
 * (SPEC §13, decision abierta 5) se borran los archivos y se cambia `imagenes`
 * en `src/content/productos.json`.
 *
 * No pasan por `gen-fotos.mjs`: ese script recorre `assets/fotos/` a un solo
 * nivel y estos viven en un subdirectorio, precisamente para que no se mezclen
 * con la fotografia de verdad. Las variantes web se escriben aqui.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const ISOTIPO = resolve(here, '../../assets/brand/nude-isotipo.svg')
const ORIGINALES = resolve(here, '../../assets/fotos/placeholder')
const WEB = resolve(here, '../public/fotos/placeholder')

const ANCHO = 900
const ALTO = 1200 // 3:4, el mismo encuadre que pide el SPEC §6

/** Cuatro superficies de la paleta. Ni un hex fuera de SPEC §2.1. */
const FONDOS = [
  { nombre: 'producto-sahara', fondo: '#EDD5B8' },
  { nombre: 'producto-cream', fondo: '#F6EBDE' },
  { nombre: 'producto-dune', fondo: '#DEB68E' },
  { nombre: 'producto-white', fondo: '#FDFAF6' },
]

/** Umber al 40% sobre Sahara: el mismo tono que usa `.img-placeholder` en CSS. */
const TRAZO = '#B3987E'

const ISOTIPO_RATIO = 0.794115
const anchoIsotipo = Math.round(ANCHO * 0.28)
const altoIsotipo = Math.round(anchoIsotipo / ISOTIPO_RATIO)

// El SVG oficial pinta con `currentColor`, que sharp no resuelve: no hay
// elemento padre del que heredar. Se sustituye por el hex antes de rasterizar.
const marca = readFileSync(ISOTIPO, 'utf8')
  .replaceAll('currentColor', TRAZO)
  .replace('<svg', `<svg width="${anchoIsotipo}" height="${altoIsotipo}"`)

mkdirSync(ORIGINALES, { recursive: true })
mkdirSync(WEB, { recursive: true })

for (const { nombre, fondo } of FONDOS) {
  const png = await sharp({
    create: { width: ANCHO, height: ALTO, channels: 4, background: fondo },
  })
    .composite([{ input: Buffer.from(marca), gravity: 'centre' }])
    .png()
    .toBuffer()

  writeFileSync(`${ORIGINALES}/${nombre}.png`, png)

  await sharp(png).avif({ quality: 52 }).toFile(`${WEB}/${nombre}-${ANCHO}.avif`)
  await sharp(png).webp({ quality: 72 }).toFile(`${WEB}/${nombre}-${ANCHO}.webp`)
  await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toFile(`${WEB}/${nombre}-${ANCHO}.jpg`)

  console.log(`${nombre}  ${ANCHO}x${ALTO}  ${fondo}`)
}

writeFileSync(
  `${ORIGINALES}/README.md`,
  `# Placeholders de producto — DESECHABLES

Generados por \`tienda/scripts/gen-placeholders.mjs\`. No son fotografia: son un
fondo plano de la paleta con el isotipo centrado, para poder construir y
verificar la card, la galeria y la ficha antes de que exista sesion de producto.

**Se borran completos** cuando entre la fotografia real (SPEC §13, decision
abierta 5). Lo que hay que cambiar entonces es \`imagenes\` en
\`tienda/src/content/productos.json\` y borrar este directorio junto con
\`tienda/public/fotos/placeholder/\`.

Los minimos que tendra que cumplir la foto de verdad estan en SPEC §6: fondo
Cream o Sahara, luz natural calida y lateral, sin flash directo, 3:4, minimo
1600px de ancho, y \`alt\` descriptivo en cada una.
`,
)
