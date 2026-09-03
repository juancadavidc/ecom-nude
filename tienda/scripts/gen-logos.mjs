/**
 * Regenera los componentes React del logo a partir de los SVG oficiales.
 *
 *   node scripts/gen-logos.mjs
 *
 * Fuente:  ../assets/brand/*.svg   (derivados del PDF vectorial de Croma Visual)
 * Salida:  src/components/brand/{Isotipo,Wordmark,Principal}.tsx
 *
 * Se inlinean como componentes en vez de servirlos como <img> por dos razones:
 * `currentColor` deja controlar el color desde CSS con un solo archivo, y el
 * logo del header entra en el HTML inicial sin una peticion extra.
 *
 * El wordmark no sale crudo del SVG: pasa por `ajustar()`. SPORTSWEAR tiene un
 * trazo casi tres veces mas fino que NUDE (3,0 vs 8,6 unidades) y era quien
 * fijaba el tamano minimo del logo — y con el, el alto del header. El ajuste
 * reparte sus diez letras hasta el ancho de NUDE, les da cuerpo con un contorno
 * del mismo color y sube el renglon. La letra no se deforma: solo cambian el
 * tracking, el grosor y el hueco vertical.
 *
 * `Principal` no tiene SVG propio: es el isotipo montado sobre el wordmark.
 * Su geometria (LOCKUP) esta medida sobre el PNG oficial
 * ../assets/brand/nude-principal.png y verificada contra los dos SVG — los
 * ratios de cada bloque coinciden con los de sus viewBox al tercer decimal,
 * asi que la composicion reproduce el lockup, no lo reinterpreta.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(here, '../../assets/brand')
const OUT = resolve(here, '../src/components/brand')

mkdirSync(OUT, { recursive: true })

function parse(file) {
  const raw = readFileSync(`${SRC}/${file}`, 'utf8')
  const viewBox = raw.match(/viewBox="([^"]+)"/)[1]
  const ds = [...raw.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1].trim())
  const [, , w, h] = viewBox.split(/\s+/).map(Number)
  return { viewBox, ds, ratio: w / h }
}

/**
 * El ajuste de SPORTSWEAR. Estos tres numeros salieron de probarlos en vivo
 * sobre la barra real; cambiarlos regenera los tres componentes a la vez.
 *
 *   anchoPct  ancho de SPORTSWEAR como % del ancho de NUDE (100 = a ras)
 *   grosor    unidades de contorno que se anaden al trazo (3,0 -> 5,0)
 *   hueco     separacion vertical entre la base de NUDE y el alto de SPORTSWEAR
 */
const AJUSTE = { anchoPct: 100, grosor: 2, hueco: 58 }

const NUMS = /-?\d+\.?\d*/g

function caja(ds) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const d of [ds].flat()) {
    const n = d.match(NUMS).map(Number)
    for (let i = 0; i < n.length; i += 2) {
      x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i])
      y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1])
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }
}

/** Traslada un path. Los SVG oficiales solo usan M/C/L/Z absolutos, asi que
 *  basta con sumar a cada par de coordenadas. */
function trasladar(d, dx, dy) {
  let i = 0
  return d.replace(NUMS, (n) => (Number(n) + (i++ % 2 === 0 ? dx : dy)).toFixed(6))
}

/**
 * Devuelve el wordmark con SPORTSWEAR re-espaciado. El viewBox se recorta a la
 * tinta real (incluido el contorno), por eso el ratio deja de ser el del SVG
 * de origen.
 */
function ajustar(word) {
  const nude = word.ds.filter((d) => !esAcento('word', d))
  const letras = word.ds.filter((d) => esAcento('word', d)).sort((a, b) => caja(a).x0 - caja(b).x0)

  const cN = caja(nude)
  const anchos = letras.map((d) => caja(d).w)
  const sumaW = anchos.reduce((a, w) => a + w, 0)

  // El contorno sobresale grosor/2 por lado: se mete el bloque hacia dentro
  // para que el borde pintado de SPORTSWEAR quede a ras con el de NUDE.
  const W = (cN.w - AJUSTE.grosor) * (AJUSTE.anchoPct / 100)
  const gap = (W - sumaW) / (letras.length - 1)
  const dy = cN.y1 + AJUSTE.hueco - caja(letras).y0

  let x = cN.x0 + (cN.w - W) / 2
  const sports = letras.map((d, i) => {
    const movido = trasladar(d, x - caja(d).x0, dy)
    x += anchos[i] + gap
    return movido
  })

  const media = AJUSTE.grosor / 2
  const alto = caja(sports).y1 + media - cN.y0
  const viewBox = [cN.x0, cN.y0, cN.w, alto].map((n) => Number(n.toFixed(4))).join(' ')

  return { viewBox, nude, sports, ratio: cN.w / alto }
}

/**
 * Geometria del lockup Principal, en las unidades del PNG oficial reescalado a
 * 1000px y con el origen en la esquina de la caja de tinta. Cambiar el PNG
 * obliga a volver a medirlo: ver el bloque "bandas" del README de assets.
 */
const LOCKUP = {
  w: 486,
  isotipo: { x: 163, y: 0, w: 160, h: 202 },
  // El wordmark ocupa todo el ancho desde y=261. Su alto ya no es un numero
  // suelto: sale del ratio del wordmark ajustado, para que NUDE conserve el
  // tamano medido en el PNG y solo se mueva SPORTSWEAR dentro de la banda.
  wordmark: { x: 0, y: 261, w: 486 },
}

/** El punto del isotipo y las diez letras de SPORTSWEAR van en Ochre; el resto
 *  del trazo en el color heredado. Se identifican por posicion, no por indice:
 *  si el SVG oficial cambia de orden, esto sigue acertando. */
function esAcento(file, d) {
  const nums = d.match(/-?\d+\.?\d*/g).map(Number)
  const ys = nums.filter((_, k) => k % 2 === 1)
  const xs = nums.filter((_, k) => k % 2 === 0)
  if (file === 'iso') {
    // el punto flotante: el unico trazo pequeno y cuadrado
    return Math.max(...xs) - Math.min(...xs) < 60 && Math.max(...ys) - Math.min(...ys) < 60
  }
  // SPORTSWEAR vive en la mitad baja del wordmark; NUDE en la alta
  return Math.min(...ys) > 550
}

function component({ name, comment, viewBox, ds, ratio }) {
  const paths = ds.map((d) => `      <path d="${d}" />`).join('\n')
  return `// Generado por scripts/gen-logos.mjs desde ecom/assets/brand — no editar a mano.
// ${comment}
// Relacion de aspecto real del trazo: ${ratio.toFixed(4)}
import type { SVGProps } from 'react'

export const ${name.toUpperCase()}_RATIO = ${ratio.toFixed(6)}

export function ${name}({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="${viewBox}"
      fill="currentColor"
      fillRule="nonzero"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
${paths}
    </svg>
  )
}
`
}

/** Wordmark ajustado: NUDE hereda el color, SPORTSWEAR va en `--logo-acento`
 *  y lleva el contorno que le da cuerpo. */
function wordmark({ viewBox, nude, sports, ratio }) {
  const p = (ds, sangria) => ds.map((d) => `${sangria}<path d="${d}" />`).join('\n')
  return `// Generado por scripts/gen-logos.mjs desde ecom/assets/brand — no editar a mano.
// Logo Principal 2: wordmark NUDE + SPORTSWEAR, sin isotipo.
// SPORTSWEAR va re-espaciado al ancho de NUDE y con ${AJUSTE.grosor} unidades de
// contorno; ver el bloque AJUSTE del generador. Relacion de aspecto: ${ratio.toFixed(4)}
import type { SVGProps } from 'react'

export const WORDMARK_RATIO = ${ratio.toFixed(6)}

/**
 * Dos tonos, igual que el lockup Principal: NUDE hereda \`currentColor\` y
 * SPORTSWEAR sale de \`--logo-acento\`. Sin esa variable queda monocromo y
 * sirve sobre cualquier fondo (SPEC §2.3).
 */
export function Wordmark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="${viewBox}"
      fill="currentColor"
      fillRule="nonzero"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
${p(nude, '      ')}
      <g
        fill="var(--logo-acento, currentColor)"
        stroke="var(--logo-acento, currentColor)"
        strokeWidth={${AJUSTE.grosor}}
        strokeLinejoin="round"
      >
${p(sports, '        ')}
      </g>
    </svg>
  )
}
`
}

function principal(iso, word) {
  // La banda del wordmark conserva la escala medida en el PNG (199/254.52): asi
  // NUDE sigue del mismo tamano dentro del lockup y lo unico que cambia es
  // SPORTSWEAR, que sube y engorda. El alto total del lockup baja con el.
  const bandaW = { ...LOCKUP.wordmark, h: LOCKUP.wordmark.w / word.ratio }
  const alto = LOCKUP.wordmark.y + bandaW.h

  const capa = ({ base, acento, viewBox, grosor }, caja) => {
    const pintar = (ds) => ds.map((d) => `        <path d="${d}" />`).join('\n')
    const g = grosor
      ? `        <g
          fill="var(--logo-acento, currentColor)"
          stroke="var(--logo-acento, currentColor)"
          strokeWidth={${grosor}}
          strokeLinejoin="round"
        >`
      : '        <g fill="var(--logo-acento, currentColor)">'
    return `      <svg
        x="${caja.x}"
        y="${caja.y}"
        width="${caja.w}"
        height="${caja.h.toFixed(2)}"
        viewBox="${viewBox}"
        overflow="visible"
      >
${pintar(base)}
${g}
${pintar(acento)}
        </g>
      </svg>`
  }

  const ratio = LOCKUP.w / alto
  return `// Generado por scripts/gen-logos.mjs desde ecom/assets/brand — no editar a mano.
// Logo Principal: isotipo sobre wordmark NUDE + SPORTSWEAR.
// Compuesto de los dos SVG oficiales con la geometria medida en nude-principal.png.
// Relacion de aspecto real del trazo: ${ratio.toFixed(4)}
import type { SVGProps } from 'react'

export const PRINCIPAL_RATIO = ${ratio.toFixed(6)}

/**
 * Dos tonos: el trazo hereda \`currentColor\` y el acento (punto del isotipo +
 * SPORTSWEAR) sale de \`--logo-acento\`. Sin esa variable el logo queda
 * monocromo, que es lo que lo mantiene usable sobre cualquier fondo (SPEC §2.3).
 */
export function Principal({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 ${LOCKUP.w} ${alto.toFixed(2)}"
      fill="currentColor"
      fillRule="nonzero"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
${capa(iso, LOCKUP.isotipo)}
${capa(word, bandaW)}
    </svg>
  )
}
`
}

const iso = parse('nude-isotipo.svg')
const wordCrudo = parse('nude-wordmark.svg')
const word = ajustar(wordCrudo)

/** Las dos capas del lockup, en la forma que espera `principal()`. */
const capaIso = {
  base: iso.ds.filter((d) => !esAcento('iso', d)),
  acento: iso.ds.filter((d) => esAcento('iso', d)),
  viewBox: iso.viewBox,
  grosor: 0,
}
const capaWord = {
  base: word.nude,
  acento: word.sports,
  viewBox: word.viewBox,
  grosor: AJUSTE.grosor,
  ratio: word.ratio,
}

writeFileSync(
  `${OUT}/Isotipo.tsx`,
  component({
    name: 'Isotipo',
    comment: 'Logo Secundario: isotipo aislado — N caligrafica con punto flotante.',
    ...iso,
  }),
)
writeFileSync(`${OUT}/Wordmark.tsx`, wordmark(word))
writeFileSync(`${OUT}/Principal.tsx`, principal(capaIso, capaWord))

const bandaH = LOCKUP.wordmark.w / word.ratio
console.log(`Isotipo   ratio ${iso.ratio.toFixed(4)}  paths ${iso.ds.length}`)
console.log(
  `Wordmark  ratio ${wordCrudo.ratio.toFixed(4)} -> ${word.ratio.toFixed(4)}` +
    `  (NUDE ${word.nude.length} + SPORTSWEAR ${word.sports.length} paths)`,
)
console.log(`Principal ratio ${(LOCKUP.w / (LOCKUP.wordmark.y + bandaH)).toFixed(4)}`)
console.log(`Ajuste    ancho ${AJUSTE.anchoPct}%  grosor +${AJUSTE.grosor}u  hueco ${AJUSTE.hueco}u`)
