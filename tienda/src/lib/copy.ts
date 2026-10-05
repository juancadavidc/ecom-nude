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
    'Lo que llevas puesto debería sentirse tan bien como lo que eres.',
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
      'Del yoga al café, del gym a la calle. Prendas que se adaptan a cómo vives, no al revés.',
  },
  {
    nombre: 'Confianza',
    texto:
      'Confianza silenciosa. Sin gritar, sin demostrar. Ropa que te acompaña sin pedir atención.',
  },
] as const

/** SPEC §7 — microcopy de comercio. Un solo lugar para que el tono no se pierda. */
export const microcopy = {
  agregar: 'Agregar al carrito',
  agregado: 'Listo. Está en tu carrito.',
  agotado: 'Agotado por ahora',
  carritoVacio: 'Todavía no has elegido nada.',
  confirmacion: 'Recibimos tu pedido.',
  envio: 'Llega en 2 a 4 días hábiles.',
  newsletter: 'Sé la primera en enterarte.',
  newsletterListo: 'Listo. Te escribimos cuando abramos.',
  newsletterError: 'Nos falta tu correo para escribirte.',
  newsletterInvalido: 'Revisa el correo: parece que le falta algo.',
  verTodo: 'Ver todo',
  cargarMas: 'Cargar más',
  sinResultados: 'No hay nada con esos filtros.',
  quitarFiltros: 'Quitar filtros',
  filtrar: 'Filtrar',
  ordenar: 'Ordenar',
  seguirViendo: 'Seguir viendo',
  finalizar: 'Finalizar compra',
  envioEnCheckout: 'El envío se calcula en el siguiente paso.',
  eliminarDelCarrito: 'Eliminar del carrito',
  guiaTallas: 'Guía de tallas',
  elegirTalla: 'Elige una talla',
  error404: 'Esta página se movió.',
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
    titulo: 'Envíos y entregas',
    texto:
      'Enviamos a todo Colombia. Llega en 2 a 4 días hábiles. El costo del envío se calcula al finalizar la compra, y puedes pagar contra entrega, en efectivo, cuando recibas.',
  },
  {
    titulo: 'Cambios y devoluciones',
    texto:
      'Tienes 15 días desde que recibes para cambiar la talla o el color. La prenda tiene que volver sin usar y con su etiqueta. Escríbenos por WhatsApp y coordinamos la recogida.',
  },
  {
    titulo: 'Cómo cuidar tu prenda',
    texto:
      'Lava a mano en agua fría y con jabón suave. Sin blanqueador y sin secadora. Seca a la sombra y extendida: el sol abre el elastano y la prenda pierde la forma.',
  },
] as const

/**
 * SPEC §4.5 — microcopy del checkout y de la confirmación. Los errores de cada
 * campo viven en `pedido-modelo.ts` (los usa también el servidor).
 */
export const checkoutCopy = {
  titulo: 'Finaliza tu pedido',
  contacto: 'Contacto',
  contactoNota: 'Te escribimos por WhatsApp para coordinar la entrega.',
  entrega: 'Entrega',
  pago: 'Pago',
  resumen: 'Tu pedido',
  transferencia: 'Transferencia',
  transferenciaDetalle: 'Nequi o Bancolombia',
  transferenciaTexto:
    'Te mostramos los datos al confirmar. Envías el comprobante por WhatsApp y despachamos el mismo día.',
  contraentrega: 'Pago contra entrega',
  contraentregaTexto: 'Pagas en efectivo cuando recibas.',
  envioElegirCiudad: 'Elige la ciudad',
  envioMetro: 'Área metropolitana',
  envioNacional: 'Envío nacional',
  codigoLabel: 'Código de descuento',
  codigoAplicar: 'Aplicar',
  codigoQuitar: 'Quitar código',
  codigoVacio: 'Escribe el código antes de aplicarlo.',
  confirmar: 'Confirmar pedido',
  revisarCampos: 'Revisa los campos marcados para poder confirmar.',
  errorGeneral: 'No pudimos guardar el pedido. Inténtalo otra vez en un momento; tu carrito sigue aquí.',
  quitar: 'Quitar',
  vacioTexto: 'Todavía no has elegido nada.',
  vacioBoton: 'Ver la colección',
  // Confirmación
  recibido: 'Recibimos tu pedido.',
  /** Tarjeta de agradecimiento oficial (branding/tarjeta-agradecimiento/). */
  bienvenida: 'Lo que llevas puesto debería sentirse tan bien como lo que eres.',
  transfiereExacto: 'Transfiere exactamente',
  sinCuentas: 'Te enviamos los datos de la cuenta por WhatsApp. Escríbenos y te respondemos con ellos.',
  despachoTransferencia: 'Cuando nos llegue el comprobante, lo despachamos el mismo día.',
  enviarComprobante: 'Enviar comprobante por WhatsApp',
  pedirDatos: 'Pedir los datos por WhatsApp',
  llega: 'Llega en 2 a 4 días hábiles.',
  efectivoListo: 'Ten listo en efectivo',
  confirmacionContraentrega: 'Antes de despacharlo te escribimos por WhatsApp para confirmarlo.',
  confirmarWhatsapp: 'Confirmar por WhatsApp',
  seguirViendo: 'Seguir viendo',
} as const
