import { Isotipo, ISOTIPO_RATIO } from './Isotipo'
import { Wordmark, WORDMARK_RATIO } from './Wordmark'

/**
 * SPEC §2.3 — los logos se usan como archivo oficial, nunca se recrean con fuentes.
 * Los SVG viven en `currentColor`: un solo archivo sirve para cualquier color de la
 * paleta y se controla desde CSS. Sobre claros va Umber, sobre oscuros va Cream.
 *
 * Se pide `alto` en px y el ancho se deriva del ratio real del trazo, para que el
 * navegador reserve el espacio exacto y no haya salto de layout (CLS).
 */

type LogoProps = {
  /** Alto del trazo en px. Header 22, footer 32. */
  alto?: number
  /** Nombre accesible. Sin el, el logo es decorativo (aria-hidden). */
  title?: string
  className?: string
}

export function LogoNude({ alto = 22, title, className }: LogoProps) {
  return (
    <Wordmark
      title={title}
      className={className}
      height={alto}
      width={Math.round(alto * WORDMARK_RATIO)}
    />
  )
}

export function MarcaNude({ alto = 32, title, className }: LogoProps) {
  return (
    <Isotipo
      title={title}
      className={className}
      height={alto}
      width={Math.round(alto * ISOTIPO_RATIO)}
    />
  )
}

export { Isotipo, Wordmark, ISOTIPO_RATIO, WORDMARK_RATIO }
