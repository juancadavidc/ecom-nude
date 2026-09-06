import type { Talla } from './producto-modelo'

/**
 * Tabla de medidas de la guia de tallas (SPEC §4.3).
 *
 * TODO(decision-abierta-1): las medidas son PROVISIONALES. El SPEC §13 deja
 * abierto si el tallaje es XS–XL o talla unica, y eso lo confirma el proveedor.
 * Publicar medidas equivocadas sube las devoluciones, que es exactamente lo que
 * la guia existe para bajar: antes de quitar el `noindex` del sitio hay que
 * reemplazar estos numeros por los del tecnico de la prenda.
 */

export type FilaTallas = {
  talla: Talla
  busto: string
  cintura: string
  cadera: string
}

export const TABLA_TALLAS: FilaTallas[] = [
  { talla: 'XS', busto: '78 – 82', cintura: '60 – 64', cadera: '86 – 90' },
  { talla: 'S', busto: '83 – 87', cintura: '65 – 69', cadera: '91 – 95' },
  { talla: 'M', busto: '88 – 92', cintura: '70 – 74', cadera: '96 – 100' },
  { talla: 'L', busto: '93 – 98', cintura: '75 – 80', cadera: '101 – 106' },
  { talla: 'XL', busto: '99 – 104', cintura: '81 – 86', cadera: '107 – 112' },
]
