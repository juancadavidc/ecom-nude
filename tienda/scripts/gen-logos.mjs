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
 * Geometria del lockup Principal, en las unidades del PNG oficial reescalado a
 * 1000px y con el origen en la esquina de la caja de tinta. Cambiar el PNG
 * obliga a volver a medirlo: ver el bloque "bandas" del README de assets.
 */
const LOCKUP = {
  w: 486,
  h: 460,
  isotipo: { x: 163, y: 0, w: 160, h: 202 },
  wordmark: { x: 0, y: 261, w: 486, h: 199 },
}

/** El punto del isotipo y las diez letras de SPORTSWEAR van en Ochre; el resto
 *  del trazo en el color heredado. Se identifican por posicion, no por indice:
 *  si el SVG oficial cambia de orden, esto sigue acertando. */
function esAcento(file, d, i) {
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

function principal(iso, word) {
  const capa = (file, { ds, viewBox }, caja) => {
    const pintar = (acento) =>
      ds
        .filter((d, i) => esAcento(file, d, i) === acento)
        .map((d) => `        <path d="${d}" />`)
        .join('\n')
    return `      <svg
        x="${caja.x}"
        y="${caja.y}"
        width="${caja.w}"
        height="${caja.h}"
        viewBox="${viewBox}"
        overflow="visible"
      >
${pintar(false)}
        <g fill="var(--logo-acento, currentColor)">
${pintar(true)}
        </g>
      </svg>`
  }

  const ratio = LOCKUP.w / LOCKUP.h
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
      viewBox="0 0 ${LOCKUP.w} ${LOCKUP.h}"
      fill="currentColor"
      fillRule="nonzero"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
${capa('iso', iso, LOCKUP.isotipo)}
${capa('word', word, LOCKUP.wordmark)}
    </svg>
  )
}
`
}

const iso = parse('nude-isotipo.svg')
const word = parse('nude-wordmark.svg')

writeFileSync(
  `${OUT}/Isotipo.tsx`,
  component({
    name: 'Isotipo',
    comment: 'Logo Secundario: isotipo aislado — N caligrafica con punto flotante.',
    ...iso,
  }),
)
writeFileSync(
  `${OUT}/Wordmark.tsx`,
  component({
    name: 'Wordmark',
    comment: 'Logo Principal 2: wordmark NUDE + SPORTSWEAR, sin isotipo.',
    ...word,
  }),
)

writeFileSync(`${OUT}/Principal.tsx`, principal(iso, word))

console.log(`Isotipo  ratio ${iso.ratio.toFixed(4)}  paths ${iso.ds.length}`)
console.log(`Wordmark ratio ${word.ratio.toFixed(4)}  paths ${word.ds.length}`)
console.log(`Principal ratio ${(LOCKUP.w / LOCKUP.h).toFixed(4)}`)
