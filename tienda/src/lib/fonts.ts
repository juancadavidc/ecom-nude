import { Cormorant_Garamond, Jost } from 'next/font/google'

/**
 * SPEC §2.2 — Cormorant es la voz emocional, Jost es la voz funcional.
 * Un precio nunca va en serif. Un manifiesto nunca va en sans.
 *
 * Se usan las versiones variables: un solo archivo cubre 200–500 en Jost
 * y 300–400 en Cormorant, lo que pesa menos que cargar cada peso estatico.
 */

export const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
  // Interfaz completa: cuerpo, botones, labels, precios, formularios, navegacion
  weight: ['200', '300', '400', '500'],
})

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  // Solo display: titulos, tagline, manifiesto, nombre de producto
  weight: ['300', '400'],
  style: ['normal', 'italic'],
})

export const fontClassNames = `${jost.variable} ${cormorant.variable}`
