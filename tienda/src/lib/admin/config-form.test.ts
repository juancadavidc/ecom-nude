import { describe, expect, it } from 'vitest'
import { leerCiudades, leerCodigos, leerCuentas, leerTarifas, leerWhatsapp } from './config-form'

function fd(campos: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(campos)) f.set(k, v)
  return f
}

describe('formularios de configuracion', () => {
  it('tarifas aceptan puntos de miles y rechazan vacio', () => {
    expect(leerTarifas(fd({ metro: '14.000', nacional: '20000' }))).toEqual({
      ok: true,
      valor: { metro: 14000, nacional: 20000 },
    })
    expect(leerTarifas(fd({ metro: '', nacional: '20000' })).ok).toBe(false)
  })

  it('ciudades: una por linea, sin repetir ni vacias', () => {
    expect(leerCiudades(fd({ ciudades: 'Medellín\n\n Envigado \nMedellín' }))).toEqual({
      ok: true,
      valor: ['Medellín', 'Envigado'],
    })
  })

  it('whatsapp agrega el 57 a un celular de 10 digitos', () => {
    expect(leerWhatsapp(fd({ whatsapp: '300 123 4567' }))).toEqual({ ok: true, valor: '573001234567' })
    expect(leerWhatsapp(fd({ whatsapp: '123' })).ok).toBe(false)
  })

  it('cuentas exigen banco, numero y titular', () => {
    const r = leerCuentas(fd({ cuentas: JSON.stringify([{ banco: 'Nequi', tipo: '', numero: '', titular: 'Daniela' }]) }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errores['cuentas.0.numero']).toBeTruthy()
  })

  it('codigos en mayuscula, sin repetir, porcentaje entero', () => {
    const ok = leerCodigos(fd({ codigos: JSON.stringify([{ codigo: 'secondskin', porcentaje: 10, activo: true }]) }))
    expect(ok).toEqual({ ok: true, valor: [{ codigo: 'SECONDSKIN', porcentaje: 10, activo: true }] })
    const dup = leerCodigos(
      fd({
        codigos: JSON.stringify([
          { codigo: 'A10', porcentaje: 10, activo: true },
          { codigo: 'a10', porcentaje: 150, activo: false },
        ]),
      }),
    )
    expect(dup.ok).toBe(false)
    if (!dup.ok) {
      expect(dup.errores['codigos.1.codigo']).toMatch(/repetido/)
      expect(dup.errores['codigos.1.porcentaje']).toBeTruthy()
    }
  })
})
