/**
 * Formato de precio colombiano: $145.000
 * Sin decimales, sin espacio despues del signo, separador de miles con punto.
 *
 * No se usa Intl.NumberFormat con `style: 'currency'` porque inserta un espacio
 * duro antes del numero ("$ 145.000") y el SPEC §4.2 fija "$145.000".
 * El separador se aplica a mano para que servidor y cliente den el mismo string
 * sin depender del ICU disponible en cada entorno.
 */
export function formatCOP(valor: number): string {
  const entero = Math.round(Math.abs(valor))
  const signo = valor < 0 ? '-' : ''
  const conPuntos = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${signo}$${conPuntos}`
}

/** Une clases ignorando falsos. Sin dependencias. */
export function cx(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ')
}
