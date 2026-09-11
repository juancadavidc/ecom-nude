import { describe, expect, it } from 'vitest'
import { agregarItem, actualizarCantidad, eliminarItem, totalesDe, type ItemCarrito } from './carrito'

function item(sku: string, overrides: Partial<ItemCarrito> = {}): Omit<ItemCarrito, 'cantidad'> {
  return {
    sku,
    productoSlug: 'legging-duna',
    nombre: 'Legging Duna',
    color: 'Duna',
    talla: 'M',
    precio: 145000,
    imagen: '/fotos/legging-duna-duna-1.jpg',
    ...overrides,
  }
}

describe('agregarItem', () => {
  it('agrega un item nuevo con cantidad 1 por defecto', () => {
    const items = agregarItem([], item('LEG-DUN-M'))
    expect(items).toEqual([{ ...item('LEG-DUN-M'), cantidad: 1 }])
  })

  it('agrega con la cantidad que se le pase', () => {
    const items = agregarItem([], item('LEG-DUN-M'), 3)
    expect(items[0].cantidad).toBe(3)
  })

  it('si el sku ya existe, suma la cantidad en vez de duplicar la fila', () => {
    const primero = agregarItem([], item('LEG-DUN-M'), 1)
    const segundo = agregarItem(primero, item('LEG-DUN-M'), 2)
    expect(segundo).toHaveLength(1)
    expect(segundo[0].cantidad).toBe(3)
  })

  it('un sku distinto agrega una fila aparte', () => {
    const primero = agregarItem([], item('LEG-DUN-M'))
    const segundo = agregarItem(primero, item('LEG-DUN-S', { talla: 'S' }))
    expect(segundo).toHaveLength(2)
  })
})

describe('actualizarCantidad', () => {
  it('cambia la cantidad de la fila con ese sku', () => {
    const items = agregarItem([], item('LEG-DUN-M'), 1)
    const actualizado = actualizarCantidad(items, 'LEG-DUN-M', 5)
    expect(actualizado[0].cantidad).toBe(5)
  })

  it('a 0 o menos elimina la fila', () => {
    const items = agregarItem([], item('LEG-DUN-M'), 1)
    expect(actualizarCantidad(items, 'LEG-DUN-M', 0)).toEqual([])
    expect(actualizarCantidad(items, 'LEG-DUN-M', -1)).toEqual([])
  })
})

describe('eliminarItem', () => {
  it('quita la fila con ese sku', () => {
    const items = agregarItem([], item('LEG-DUN-M'))
    expect(eliminarItem(items, 'LEG-DUN-M')).toEqual([])
  })

  it('un sku que no existe no revienta ni cambia nada', () => {
    const items = agregarItem([], item('LEG-DUN-M'))
    expect(eliminarItem(items, 'NO-EXISTE')).toEqual(items)
  })
})

describe('totalesDe', () => {
  it('carrito vacio da ceros', () => {
    expect(totalesDe([])).toEqual({ cantidad: 0, subtotal: 0 })
  })

  it('suma cantidad y precio * cantidad de cada fila', () => {
    let items = agregarItem([], item('LEG-DUN-M', { precio: 145000 }), 2)
    items = agregarItem(items, item('TOP-BRI-S', { talla: 'S', precio: 89000 }), 1)
    expect(totalesDe(items)).toEqual({ cantidad: 3, subtotal: 379000 })
  })
})
