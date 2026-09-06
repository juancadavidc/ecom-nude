/**
 * Copy aprobado. No se reescribe aqui: se reutiliza tal cual del brand book,
 * de la landing (`landing/landing-page/public/index.html`) y de la tarjeta de
 * agradecimiento oficial.
 *
 * SPEC §7 — la voz aplicada al comercio. Sin emojis, sin signos de exclamacion,
 * sin urgencia falsa.
 */

export const manifiesto = {
  label: 'Manifiesto',
  // Tarjeta de agradecimiento oficial (branding/tarjeta-agradecimiento/)
  parrafos: [
    'Lo que llevas puesto deberia sentirse tan bien como lo que eres.',
    'No hacemos ropa para que te veas entrenando. Hacemos prendas que se sienten como parte de ti — suaves, seguras, sin esfuerzo.',
  ],
} as const

/** SPEC §4.1 bloque 6 — los tres pilares, copy tal cual de la landing */
export const pilares = [
  {
    nombre: 'Suavidad',
    texto:
      'Tela que se siente como tu propia piel. Segunda capa, no disfraz. Cada textura pensada para que la olvides puesta.',
  },
  {
    nombre: 'Movimiento',
    texto:
      'Del yoga al cafe, del gym a la calle. Prendas que se adaptan a como vives, no al reves.',
  },
  {
    nombre: 'Confianza',
    texto:
      'Confianza silenciosa. Sin gritar, sin demostrar. Ropa que te acompana sin pedir atencion.',
  },
] as const

/** SPEC §7 — microcopy de comercio. Un solo lugar para que el tono no se pierda. */
export const microcopy = {
  agregar: 'Agregar al carrito',
  agregado: 'Listo. Esta en tu carrito.',
  agotado: 'Agotado por ahora',
  carritoVacio: 'Todavia no has elegido nada.',
  confirmacion: 'Recibimos tu pedido.',
  envio: 'Llega en 2 a 4 dias habiles.',
  newsletter: 'Se la primera en enterarte.',
  verTodo: 'Ver todo',
  cargarMas: 'Cargar mas',
  sinResultados: 'No hay nada con esos filtros.',
  quitarFiltros: 'Quitar filtros',
  filtrar: 'Filtrar',
  ordenar: 'Ordenar',
  seguirViendo: 'Seguir viendo',
  finalizar: 'Finalizar compra',
  guiaTallas: 'Guia de tallas',
  error404: 'Esta pagina se movio.',
} as const
