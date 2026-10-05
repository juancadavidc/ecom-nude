import { describe, expect, it } from 'vitest'
import {
  cambiarCodigo,
  codigoDeColor,
  codigoPorDefecto,
  renombrarColor,
  sincronizarVariantes,
  skusRepetidos,
  type VarianteEditor,
} from './variantes'

const guardadas: VarianteEditor[] = [
  { color: 'Negro', talla: 'S', sku: '54-S', disponible: true },
  { color: 'Negro', talla: 'M', sku: '54-M', disponible: false },
  { color: 'Rojo', talla: 'S', sku: 'A-MANO', disponible: true },
]

describe('sincronizarVariantes', () => {
  it('genera la grilla completa color × talla en el orden de las tallas', () => {
    const r = sincronizarVariantes([{ nombre: 'Café', codigo: 'LR-CAFE' }], ['L', 'S'], [])
    expect(r.map((v) => v.sku)).toEqual(['LR-CAFE-S', 'LR-CAFE-L'])
    expect(r.every((v) => v.disponible)).toBe(true)
  })

  it('conserva SKU y disponibilidad de las combinaciones que ya existian', () => {
    const r = sincronizarVariantes(
      [
        { nombre: 'Negro', codigo: '54' },
        { nombre: 'Rojo', codigo: 'OTRO' },
      ],
      ['S', 'M'],
      guardadas,
    )
    expect(r).toContainEqual({ color: 'Negro', talla: 'M', sku: '54-M', disponible: false })
    expect(r).toContainEqual({ color: 'Rojo', talla: 'S', sku: 'A-MANO', disponible: true })
    // La que faltaba se crea con el codigo del color.
    expect(r).toContainEqual({ color: 'Rojo', talla: 'M', sku: 'OTRO-M', disponible: true })
  })

  it('descarta las variantes de colores y tallas quitados', () => {
    const r = sincronizarVariantes([{ nombre: 'Negro', codigo: '54' }], ['S'], guardadas)
    expect(r).toEqual([{ color: 'Negro', talla: 'S', sku: '54-S', disponible: true }])
  })
})

describe('SKU estables al editar', () => {
  it('renombrar un color no cambia sus SKU', () => {
    const r = renombrarColor(guardadas, 'Negro', 'Negro azabache')
    expect(r.filter((v) => v.color === 'Negro azabache').map((v) => v.sku)).toEqual(['54-S', '54-M'])
  })

  it('cambiar el codigo solo pisa los SKU que seguian el patron', () => {
    const r = cambiarCodigo(
      [...guardadas, { color: 'Negro', talla: 'L', sku: 'ESPECIAL', disponible: true }],
      'Negro',
      '54',
      'NG',
    )
    expect(r.filter((v) => v.color === 'Negro').map((v) => v.sku)).toEqual(['NG-S', 'NG-M', 'ESPECIAL'])
  })

  it('deduce el codigo de un color a partir de sus SKU', () => {
    expect(codigoDeColor([{ talla: 'S', sku: 'PRD-1789502361-S' }])).toBe('PRD-1789502361')
    expect(codigoDeColor([{ talla: 'U', sku: 'SUELTO' }])).toBe('SUELTO')
  })
})

describe('codigoPorDefecto', () => {
  it('usa iniciales del producto y el color sin tildes', () => {
    expect(codigoPorDefecto('legging-rib-tiro-alto', 'Café', [])).toBe('LRTA-CAFE')
  })
  it('agrega un numero si el codigo ya esta usado', () => {
    expect(codigoPorDefecto('legging-rib', 'Café', ['LR-CAFE'])).toBe('LR-CAFE2')
  })
})

it('skusRepetidos ignora mayusculas', () => {
  expect(skusRepetidos([{ sku: 'a-1' }, { sku: 'A-1' }, { sku: 'b' }])).toEqual(['A-1'])
})
