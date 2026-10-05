import { describe, expect, it } from 'vitest'
import { celularInternacional, enlaceWhatsApp, motivoBloqueo, siguientesEstados } from './pedidos-estado'

describe('transiciones de estado', () => {
  it('contra entrega: no se envia sin confirmar', () => {
    expect(motivoBloqueo({ estado: 'nuevo', metodoPago: 'contraentrega' }, 'enviado')).toMatch(/confirma/)
    expect(motivoBloqueo({ estado: 'confirmado', metodoPago: 'contraentrega' }, 'enviado')).toBeNull()
  })

  it('contra entrega: el pago se recibe al entregar', () => {
    expect(siguientesEstados({ estado: 'nuevo', metodoPago: 'contraentrega' })).toEqual(['confirmado', 'cancelado'])
    expect(siguientesEstados({ estado: 'confirmado', metodoPago: 'contraentrega' })).toEqual(['enviado', 'cancelado'])
  })

  it('transferencia: no se envia sin pago recibido', () => {
    expect(motivoBloqueo({ estado: 'confirmado', metodoPago: 'transferencia' }, 'enviado')).toMatch(/pago/)
    expect(siguientesEstados({ estado: 'nuevo', metodoPago: 'transferencia' })).toEqual([
      'confirmado',
      'pagado',
      'cancelado',
    ])
    expect(siguientesEstados({ estado: 'pagado', metodoPago: 'transferencia' })).toEqual(['enviado', 'cancelado'])
  })

  it('entregado es final y cancelado se puede reabrir', () => {
    expect(siguientesEstados({ estado: 'entregado', metodoPago: 'transferencia' })).toEqual([])
    expect(siguientesEstados({ estado: 'cancelado', metodoPago: 'transferencia' })).toEqual(['nuevo'])
  })
})

describe('WhatsApp', () => {
  it('agrega el 57 a un celular colombiano', () => {
    expect(celularInternacional('300 123 4567')).toBe('573001234567')
    expect(celularInternacional('+57 300-123-4567')).toBe('573001234567')
  })
  it('arma el enlace con el numero de pedido', () => {
    const url = enlaceWhatsApp({ celular: '3001234567', numero: 1042, nombre: 'Laura Gómez' })
    expect(url.startsWith('https://wa.me/573001234567?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Hola Laura, te escribimos de NUDE por tu pedido #1042.')
  })
})
