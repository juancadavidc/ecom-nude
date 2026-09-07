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
  newsletterListo: 'Listo. Te escribimos cuando abramos.',
  newsletterError: 'Nos falta tu correo para escribirte.',
  newsletterInvalido: 'Revisa el correo: parece que le falta algo.',
  verTodo: 'Ver todo',
  cargarMas: 'Cargar mas',
  sinResultados: 'No hay nada con esos filtros.',
  quitarFiltros: 'Quitar filtros',
  filtrar: 'Filtrar',
  ordenar: 'Ordenar',
  seguirViendo: 'Seguir viendo',
  finalizar: 'Finalizar compra',
  guiaTallas: 'Guia de tallas',
  elegirTalla: 'Elige una talla',
  error404: 'Esta pagina se movio.',
} as const

/**
 * SPEC §4.3 — los tres acordeones de la ficha. Estan aqui y no en la pagina para
 * que el dia que existan /envios y /cambios como paginas de contenido el texto
 * salga de un solo sitio.
 *
 * TODO(decision-abierta-3): no se nombra tarifa ni umbral de envio gratis. El
 * SPEC §13 deja abierto cotizar transportadora y confirmar si $14.000 y $20.000
 * cubren el costo real; poner una cifra que despues cambie es peor que no
 * ponerla.
 */
export const politicas = [
  {
    titulo: 'Envios y entregas',
    texto:
      'Enviamos a todo Colombia. Llega en 2 a 4 dias habiles. El costo del envio se calcula al finalizar la compra, y puedes pagar contra entrega, en efectivo, cuando recibas.',
  },
  {
    titulo: 'Cambios y devoluciones',
    texto:
      'Tienes 15 dias desde que recibes para cambiar la talla o el color. La prenda tiene que volver sin usar y con su etiqueta. Escribinos por WhatsApp y coordinamos la recogida.',
  },
  {
    titulo: 'Como cuidar tu prenda',
    texto:
      'Lava a mano en agua fria y con jabon suave. Sin blanqueador y sin secadora. Seca a la sombra y extendida: el sol abre el elastano y la prenda pierde la forma.',
  },
] as const
