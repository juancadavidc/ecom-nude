/**
 * Regenera los componentes React del logo a partir de los SVG oficiales.
 *
 *   node scripts/gen-logos.mjs
 *
 * Fuente:  ../assets/brand/*.svg   (derivados del PDF vectorial de Croma Visual)
 * Salida:  src/components/brand/{Isotipo,Wordmark}.tsx
 *
 * Se inlinean como componentes en vez de servirlos como <img> por dos razones:
 * `currentColor` deja controlar el color desde CSS con un solo archivo, y el
 * logo del header entra en el HTML inicial sin una peticion extra.
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

console.log(`Isotipo  ratio ${iso.ratio.toFixed(4)}  paths ${iso.ds.length}`)
console.log(`Wordmark ratio ${word.ratio.toFixed(4)}  paths ${word.ds.length}`)
