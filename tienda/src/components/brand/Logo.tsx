import { Isotipo, ISOTIPO_RATIO } from './Isotipo'
import { Principal, PRINCIPAL_RATIO } from './Principal'
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
  /** Alto del trazo en px. El ancho sale del ratio real de cada version. */
  alto?: number
  /** Nombre accesible. Sin el, el logo es decorativo (aria-hidden). */
  title?: string
  className?: string
}

/**
 * Lockup Principal: isotipo sobre wordmark. Es el logo del header.
 * Es casi cuadrado (ratio 1.06), no apaisado como el wordmark suelto: ocupa
 * poco ancho y mucho alto, y por eso el header es mas alto que un header tipico.
 *
 * Lleva dos tonos. El acento se enciende desde CSS con `--logo-acento`; sin esa
 * variable sale monocromo y sirve sobre cualquier fondo (SPEC §2.3).
 */
export function LogoPrincipal({ alto = 70, title, className }: LogoProps) {
  return (
    <Principal
      title={title}
      className={className}
      height={alto}
      width={Math.round(alto * PRINCIPAL_RATIO)}
    />
  )
}

/** Logo Principal 2: solo el wordmark, apaisado. Footer y checkout. */
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

export { Isotipo, Principal, Wordmark, ISOTIPO_RATIO, PRINCIPAL_RATIO, WORDMARK_RATIO }
