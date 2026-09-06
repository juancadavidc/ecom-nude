/**
 * Recortes 3:4 del triptico del hero.
 *
 *   node scripts/gen-recortes.mjs && node scripts/gen-fotos.mjs
 *
 * `assets/fotos/home-hero.png` es un triptico de 1366x768: TRES tomas distintas
 * de la misma sesion, no la misma foto tres veces. Recortarlas por separado para
 * los tiles de categoria y la grilla de comunidad es legitimo; repetir el mismo
 * encuadre no lo seria, asi que cada salida tiene su propia ventana.
 *
 * Escribe en `assets/fotos/` a proposito: desde ahi `gen-fotos.mjs` genera las
 * variantes AVIF/WebP/JPG con la misma calidad que el resto del sitio.
 *
 * TODO(decision-abierta-5): esto desaparece cuando haya sesion de producto real.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const FUENTE = resolve(here, '../../assets/fotos/home-hero.png')
const SALIDA = resolve(here, '../../assets/fotos')

/** Los tres paneles del triptico. `x` esquiva la banda blanca que los separa. */
const PANELES = [
  { x: 6, w: 441 }, // perfil: espalda del top y cinturilla del legging
  { x: 464, w: 441 }, // frontal: torso y top
  { x: 920, w: 441 }, // cuerpo entero
]

const alto = (w) => Math.round((w * 4) / 3)

/**
 * `y` se elige por lo que tiene que quedar dentro, no por centrar:
 * el de tops sube al torso y el de sets busca el cuerpo entero.
 *
 * El de leggings no cabe a 441x588: el panel mide 768 de alto, asi que la
 * `y` maxima para un recorte de 588 es 180, y a esa altura el borde superior
 * todavia corta la cara a la altura de la boca mientras el legging queda
 * reducido a una franja de cinturilla. Ninguna `y` a ese tamano resuelve las
 * dos cosas a la vez, asi que el recorte usa una ventana mas corta y angosta
 * (mismo mecanismo `w`/`dx` que ya usan comunidad-4/5/6), pegada al borde
 * inferior del panel para que la pierna con el corte de malla domine el
 * encuadre.
 */
const RECORTES = [
  { nombre: 'categoria-leggings', panel: 0, y: 395, w: 280, dx: 50 },
  { nombre: 'categoria-tops', panel: 1, y: 90 },
  { nombre: 'categoria-sets', panel: 2, y: 150 },
  { nombre: 'comunidad-1', panel: 0, y: 0 },
  { nombre: 'comunidad-2', panel: 1, y: 0 },
  { nombre: 'comunidad-3', panel: 2, y: 0 },
  // Ventana mas corta y mas baja: encuadre distinto, no el mismo recorte movido
  { nombre: 'comunidad-4', panel: 0, y: 208, w: 360, dx: 40 },
  { nombre: 'comunidad-5', panel: 1, y: 208, w: 360, dx: 40 },
  { nombre: 'comunidad-6', panel: 2, y: 208, w: 360, dx: 40 },
]

for (const r of RECORTES) {
  const panel = PANELES[r.panel]
  const w = r.w ?? panel.w
  const h = alto(w)
  const left = panel.x + (r.dx ?? 0)

  await sharp(FUENTE)
    .extract({ left, top: r.y, width: w, height: h })
    .png()
    .toFile(`${SALIDA}/${r.nombre}.png`)

  console.log(`${r.nombre}  ${w}x${h}  desde (${left}, ${r.y})`)
}
