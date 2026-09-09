import { describe, expect, it } from 'vitest'
import { correoPermitido, leerAllowlist } from './allowlist'

describe('leerAllowlist', () => {
  it('separa por coma, recorta espacios y pasa a minusculas', () => {
    expect(leerAllowlist('Daniela@Nude.co, juan@nude.co ,')).toEqual(['daniela@nude.co', 'juan@nude.co'])
  })

  it('una cadena vacia da una lista vacia', () => {
    expect(leerAllowlist('')).toEqual([])
  })
})

describe('correoPermitido', () => {
  it('acepta un correo de la allowlist sin importar mayusculas', () => {
    expect(correoPermitido('Daniela@NudeSportswear.co', ['daniela@nudesportswear.co'])).toBe(true)
  })

  it('rechaza un correo fuera de la allowlist', () => {
    expect(correoPermitido('otra@gmail.com', ['daniela@nudesportswear.co'])).toBe(false)
  })
})
