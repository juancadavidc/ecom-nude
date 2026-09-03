/**
 * Configuracion de sitio. Lo que aqui es constante y en la fase 2 pasa a
 * `config/tienda` en Firestore queda marcado con TODO(fase-2).
 */

export const site = {
  nombre: 'NUDE SPORTSWEAR',
  nombreCorto: 'NUDE',
  tagline: 'Tu segunda piel.',
  descripcion:
    'Leggings y tops disenados para moverte. Hechos para quedarse. Ropa deportiva femenina colombiana en tonos tierra.',
  url: 'https://nudesportswear.co',
  instagram: 'nudesportswear.co',
  instagramUrl: 'https://instagram.com/nudesportswear.co',
  // TODO(fase-2): numero real de WhatsApp — hoy es el placeholder del linktree
  whatsapp: '573000000000',
  whatsappUrl: 'https://wa.me/573000000000',
  email: 'somosnudesw@gmail.com',
} as const

/** SPEC §3 — tres categorias de producto, dos de contenido. Sin ramas vacias. */
export const navPrincipal = [
  { label: 'Leggings', href: '/leggings' },
  { label: 'Tops', href: '/tops' },
  { label: 'Sets', href: '/sets' },
  { label: 'Coleccion', href: '/coleccion' },
  { label: 'Nosotras', href: '/nosotras' },
] as const

export const navPie = [
  {
    titulo: 'Tienda',
    links: [
      { label: 'Leggings', href: '/leggings' },
      { label: 'Tops', href: '/tops' },
      { label: 'Sets', href: '/sets' },
      { label: 'Coleccion', href: '/coleccion' },
    ],
  },
  {
    titulo: 'Ayuda',
    links: [
      { label: 'Guia de tallas', href: '/guia-de-tallas' },
      { label: 'Envios y entregas', href: '/envios' },
      { label: 'Cambios y devoluciones', href: '/cambios' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    titulo: 'NUDE',
    links: [
      { label: 'Nosotras', href: '/nosotras' },
      { label: 'Terminos y condiciones', href: '/legales' },
      { label: 'Tratamiento de datos', href: '/legales#datos' },
    ],
  },
] as const

/** SPEC §4.1 bloque 7 — franja de confianza */
export const promesas = [
  { titulo: 'Envio a todo Colombia', detalle: 'Llega en 2 a 4 dias habiles.' },
  { titulo: 'Pago contra entrega', detalle: 'Pagas en efectivo cuando recibas.' },
  { titulo: 'Cambios en 15 dias', detalle: 'Si no es tu talla, la cambiamos.' },
] as const
