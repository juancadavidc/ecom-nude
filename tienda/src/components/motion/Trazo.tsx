'use client'

import { cx } from '@/lib/format'
import { useEnVista } from './useEnVista'

/**
 * EL TRAZO CONTINUO — elemento distintivo del sitio (SPEC §11.1).
 *
 * El isotipo de NUDE es un trazo caligrafico continuo: la N y su punto se
 * dibujan sin levantar la mano. Ese principio se convierte en el sistema
 * estructural del sitio: en vez de reglas horizontales sueltas separando
 * secciones, hay UNA sola linea Ochre de 1px que desciende por la pagina,
 * se desplaza lateralmente en cada cambio de seccion y vuelve a bajar.
 *
 * Tecnica general: `pathLength="1"` normaliza la longitud del path, asi que
 * `stroke-dasharray: 1; stroke-dashoffset: 1 → 0` lo dibuja sin medir nada
 * con JS. La usan `TrazoCierre` y `TrazoPaso`.
 *
 * `TrazoColumna` es la excepcion: dibuja con `clip-path`, no con dasharray.
 * Con `alto="100%"` (columna del catalogo y de la ficha) el SVG se estira
 * varias veces en vertical, y ahi el dasharray normalizado por pathLength
 * hace que Chrome PINTE el trazo partido en pedazos con huecos — es un bug de
 * rasterizado confirmado con `path.isPointInStroke()` (la geometria del
 * guion es continua; lo que se pinta mal es el guion sobre un SVG estirado de
 * forma no uniforme), no un error de este CSS, y no depende de
 * `vector-effect`. El detalle completo esta en el comentario de `.trazo path`
 * en globals.css.
 *
 * `prefers-reduced-motion`: la linea aparece dibujada, sin animacion
 * (regla en globals.css).
 */

type TrazoProps = {
  className?: string
  /** Se dibuja al entrar en vista. En el header conviene `false`: dibuja al cargar. */
  esperarVista?: boolean
}

/** Linea vertical de 1px. Acompana una columna, conecta dos bloques. */
export function TrazoColumna({
  alto,
  className,
  esperarVista = true,
}: TrazoProps & { alto?: number | string }) {
  const { ref, enVista } = useEnVista<SVGSVGElement>()

  return (
    <svg
      ref={ref}
      className={cx('trazo trazo-columna', className)}
      data-drawn={!esperarVista || enVista || undefined}
      viewBox="0 0 1 100"
      preserveAspectRatio="none"
      style={{ height: alto, width: 1 }}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 0.5 0 L 0.5 100" />
    </svg>
  )
}

/**
 * Cierre del trazo: baja y termina en el punto.
 * Es el mismo gesto del isotipo — trazo + punto flotante — y va en el footer,
 * bajo el isotipo, cerrando el recorrido de la pagina.
 */
export function TrazoCierre({ className, esperarVista = true }: TrazoProps) {
  const { ref, enVista } = useEnVista<SVGSVGElement>()

  return (
    <svg
      ref={ref}
      className={cx('trazo', className)}
      data-drawn={!esperarVista || enVista || undefined}
      viewBox="0 0 12 72"
      width={12}
      height={72}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 6 0 L 6 60" pathLength={1} />
      <circle cx={6} cy={68} r={2} />
    </svg>
  )
}

/**
 * Paso lateral: la linea baja, se desplaza y vuelve a bajar.
 * Es la transicion entre dos secciones — reemplaza el separador horizontal.
 * `direccion` dice hacia donde se corre el eje.
 */
export function TrazoPaso({
  className,
  direccion = 'derecha',
  esperarVista = true,
}: TrazoProps & { direccion?: 'izquierda' | 'derecha' }) {
  const { ref, enVista } = useEnVista<SVGSVGElement>()
  const d =
    direccion === 'derecha'
      ? 'M 1 0 L 1 40 Q 1 56 17 56 L 79 56 Q 95 56 95 72 L 95 112'
      : 'M 95 0 L 95 40 Q 95 56 79 56 L 17 56 Q 1 56 1 72 L 1 112'

  return (
    <svg
      ref={ref}
      className={cx('trazo', className)}
      data-drawn={!esperarVista || enVista || undefined}
      // 1 unidad de margen a cada lado: sin ella los tramos verticales quedan
      // en el borde exacto y el navegador recorta medio pixel del trazo
      viewBox="-1 -1 98 114"
      width={98}
      height={114}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} pathLength={1} />
    </svg>
  )
}
