/** Fechas del panel en hora de Colombia, sin depender de la zona del servidor. */
const CORTA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

const LARGA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function fechaCorta(d: Date): string {
  return CORTA.format(d).replace(/\s/g, ' ')
}

export function fechaLarga(d: Date): string {
  const s = LARGA.format(d).replace(/\s/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
