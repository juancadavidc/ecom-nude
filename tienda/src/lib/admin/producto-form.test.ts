import { describe, expect, it } from 'vitest'
import { detallesDeTexto, seoPorDefecto, validarProducto } from './producto-form'

function base(extra: Record<string, unknown> = {}) {
  return {
    nombre: 'Legging Rib',
    slug: 'legging-rib',
    categoria: 'leggings',
    marca: 'FIT LAB',
    precio: 120000,
    descripcion: 'Tiro alto.',
    detalles: ['Tiro alto'],
    estado: 'borrador',
    destacado: false,
    seo: { titulo: 'Legging Rib', descripcion: 'Tiro alto.', alt: 'Legging rib negro' },
    colores: [{ nombre: 'Negro', hex: '#222222', precio: null, codigo: 'LR-NEGRO', original: null }],
    tallas: ['S', 'M'],
    variantes: [
      { color: 'Negro', talla: 'S', sku: 'LR-NEGRO-S', disponible: true },
      { color: 'Negro', talla: 'M', sku: 'LR-NEGRO-M', disponible: false },
    ],
    combinaCon: [],
    ...extra,
  }
}

describe('validarProducto', () => {
  it('acepta un producto completo', () => {
    const r = validarProducto(base(), { fotosPorColor: {} })
    expect(r.ok).toBe(true)
  })

  it('regla de publicacion: no se activa sin fotos', () => {
    const r = validarProducto(base({ estado: 'activo' }), { fotosPorColor: {} })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errores.estado).toMatch(/al menos una foto/)
  })

  it('se activa con una foto en un color que sigue existiendo', () => {
    const colores = [{ nombre: 'Negro', hex: '#222222', precio: null, codigo: 'LR-NEGRO', original: 'Negro' }]
    const r = validarProducto(base({ estado: 'activo', colores }), { fotosPorColor: { Negro: 2 } })
    expect(r.ok).toBe(true)
  })

  it('no deja quitar un color que tiene fotos', () => {
    const r = validarProducto(base(), { fotosPorColor: { Rojo: 3 } })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errores.colores).toMatch(/Rojo.*3 fotos/)
  })

  it('el precio de un color no puede ser menor que el base, e igual al base se guarda como null', () => {
    const menor = validarProducto(
      base({ colores: [{ nombre: 'Negro', hex: '#222222', precio: 90000, codigo: 'X', original: null }] }),
      { fotosPorColor: {} },
    )
    expect(menor.ok).toBe(false)
    const igual = validarProducto(
      base({ colores: [{ nombre: 'Negro', hex: '#222222', precio: 120000, codigo: 'X', original: null }] }),
      { fotosPorColor: {} },
    )
    expect(igual.ok && igual.datos.colores[0].precio).toBe(null)
  })

  it('exige la grilla completa y SKU unicos', () => {
    const falta = validarProducto(base({ tallas: ['S', 'M', 'L'] }), { fotosPorColor: {} })
    expect(!falta.ok && falta.errores.variantes).toMatch(/Falta la talla L/)
    const dup = validarProducto(
      base({
        variantes: [
          { color: 'Negro', talla: 'S', sku: 'IGUAL', disponible: true },
          { color: 'Negro', talla: 'M', sku: 'igual', disponible: true },
        ],
      }),
      { fotosPorColor: {} },
    )
    expect(!dup.ok && dup.errores.variantes).toMatch(/repetido/)
  })

  it('rechaza slug con tildes o espacios y nombres de color repetidos', () => {
    const r = validarProducto(
      base({
        slug: 'Legging Café',
        colores: [
          { nombre: 'Negro', hex: '#222222', precio: null, codigo: 'A', original: null },
          { nombre: 'negro', hex: '#222222', precio: null, codigo: 'B', original: null },
        ],
      }),
      { fotosPorColor: {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errores.slug).toBeTruthy()
      expect(r.errores['colores.1.nombre']).toMatch(/Ya hay un color/)
    }
  })
})

it('seoPorDefecto recorta la descripcion a 160 caracteres', () => {
  const s = seoPorDefecto('Top Duna', 'palabra '.repeat(40), 'Tops y buzos')
  expect(s.titulo).toBe('Top Duna')
  expect(s.descripcion.length).toBeLessThanOrEqual(160)
  expect(s.alt).toBe('Top Duna, de la categoría tops y buzos')
})

it('detallesDeTexto: una linea, un detalle', () => {
  expect(detallesDeTexto(' Tela fría \n\n Siso trasero\n')).toEqual(['Tela fría', 'Siso trasero'])
})
