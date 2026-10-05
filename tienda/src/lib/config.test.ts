import { describe, expect, it } from 'vitest'
import { CONFIG_POR_DEFECTO, descuentoPara, envioPara, partirCiudadMetro } from './config'

describe('envioPara', () => {
  const cfg = CONFIG_POR_DEFECTO

  it('cobra metro en el Valle de Aburra y nacional fuera', () => {
    expect(envioPara('Medellín', cfg, 'Antioquia')).toBe(14000)
    expect(envioPara('medellin', cfg, 'antioquia')).toBe(14000)
    expect(envioPara('Cali', cfg, 'Valle del Cauca')).toBe(20000)
  })

  it('distingue municipios homonimos por departamento', () => {
    expect(envioPara('Barbosa', cfg, 'Antioquia')).toBe(14000)
    expect(envioPara('Barbosa', cfg, 'Santander')).toBe(20000)
  })

  it('una entrada sin departamento coincide en cualquiera', () => {
    const viejo = { ...cfg, ciudadesMetro: ['Medellín'] }
    expect(envioPara('Medellín', viejo, 'Antioquia')).toBe(14000)
  })

  it('parte "Ciudad, Departamento"', () => {
    expect(partirCiudadMetro('La Estrella, Antioquia')).toEqual({ ciudad: 'La Estrella', departamento: 'Antioquia' })
    expect(partirCiudadMetro('Bello')).toEqual({ ciudad: 'Bello', departamento: null })
  })
})

describe('descuentoPara', () => {
  it('aplica solo codigos activos, sin importar mayusculas', () => {
    const codigos = [{ codigo: 'SECONDSKIN', porcentaje: 10, activo: true }, { codigo: 'VIEJO', porcentaje: 50, activo: false }]
    expect(descuentoPara('secondskin', 100000, codigos)).toBe(10000)
    expect(descuentoPara('VIEJO', 100000, codigos)).toBe(0)
    expect(descuentoPara(null, 100000, codigos)).toBe(0)
  })
})
