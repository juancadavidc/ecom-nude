import { describe, expect, it } from 'vitest'
import { DEPARTAMENTOS, esMunicipioDe, municipiosDe } from './colombia'
import { CONFIG_POR_DEFECTO } from './config'
import {
  CAMPOS_VACIOS,
  MENSAJES,
  descuentoConPorcentaje,
  formatoCelular,
  leerCampos,
  limitarCantidad,
  normalizarCelular,
  primerNombre,
  totalDe,
  validarCampo,
  validarPedido,
  type CamposPedido,
} from './pedido-modelo'

const valido: CamposPedido = {
  nombre: 'Daniela Restrepo',
  celular: '300 123 4567',
  correo: 'Daniela@Correo.com ',
  departamento: 'Antioquia',
  ciudad: 'Medellín',
  direccion: 'Calle 10 # 43-21, apto 502',
  barrio: 'El Poblado',
  indicaciones: '',
  metodoPago: 'transferencia',
}

describe('normalizarCelular', () => {
  it.each([
    ['3001234567', '3001234567'],
    ['300 123 4567', '3001234567'],
    ['300-123-4567', '3001234567'],
    ['(300) 123 4567', '3001234567'],
    ['+57 300 123 4567', '3001234567'],
    ['573001234567', '3001234567'],
  ])('acepta %s', (entrada, esperado) => {
    expect(normalizarCelular(entrada)).toBe(esperado)
  })

  it.each(['', '6041234567', '300123456', '30012345678', '+1 300 123 4567', '300abc4567', '57300123456'])(
    'rechaza %s',
    (entrada) => {
      expect(normalizarCelular(entrada)).toBeNull()
    },
  )

  it('formatea para mostrar', () => {
    expect(formatoCelular('3001234567')).toBe('300 123 4567')
  })
})

describe('validarCampo', () => {
  it('dice como resolver cada campo vacio', () => {
    expect(validarCampo('nombre', CAMPOS_VACIOS)).toBe(MENSAJES.nombreVacio)
    expect(validarCampo('celular', CAMPOS_VACIOS)).toBe(MENSAJES.celularVacio)
    expect(validarCampo('correo', CAMPOS_VACIOS)).toBe(MENSAJES.correoVacio)
    expect(validarCampo('departamento', CAMPOS_VACIOS)).toBe(MENSAJES.departamentoVacio)
    expect(validarCampo('ciudad', CAMPOS_VACIOS)).toBe(MENSAJES.ciudadVacia)
    expect(validarCampo('direccion', CAMPOS_VACIOS)).toBe(MENSAJES.direccionVacia)
    expect(validarCampo('barrio', CAMPOS_VACIOS)).toBe(MENSAJES.barrioVacio)
    expect(validarCampo('metodoPago', CAMPOS_VACIOS)).toBe(MENSAJES.metodoPagoVacio)
  })

  it('las indicaciones son opcionales', () => {
    expect(validarCampo('indicaciones', CAMPOS_VACIOS)).toBeUndefined()
  })

  it('pide el apellido', () => {
    expect(validarCampo('nombre', { ...valido, nombre: 'Daniela' })).toBe(MENSAJES.nombreIncompleto)
  })

  it('rechaza un correo sin dominio', () => {
    expect(validarCampo('correo', { ...valido, correo: 'daniela@correo' })).toBe(MENSAJES.correoInvalido)
  })

  it('la ciudad tiene que ser del departamento elegido', () => {
    expect(validarCampo('ciudad', { ...valido, departamento: 'Valle del Cauca', ciudad: 'Medellín' })).toBe(
      MENSAJES.ciudadInvalida,
    )
    expect(validarCampo('ciudad', { ...valido, departamento: 'Valle del Cauca', ciudad: 'Cali' })).toBeUndefined()
  })

  it('una direccion necesita al menos un numero', () => {
    expect(validarCampo('direccion', { ...valido, direccion: 'Por la iglesia' })).toBe(MENSAJES.direccionCorta)
  })

  it('corta lo que no cabe', () => {
    expect(validarCampo('barrio', { ...valido, barrio: 'x'.repeat(200) })).toBe(MENSAJES.demasiadoLargo)
  })

  it('rechaza un metodo de pago inventado', () => {
    expect(validarCampo('metodoPago', { ...valido, metodoPago: 'tarjeta' })).toBe(MENSAJES.metodoPagoVacio)
  })
})

describe('validarPedido', () => {
  it('normaliza lo que guarda', () => {
    const r = validarPedido({ ...valido, nombre: '  Daniela   Restrepo ' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.datos.nombre).toBe('Daniela Restrepo')
    expect(r.datos.celular).toBe('3001234567')
    expect(r.datos.correo).toBe('daniela@correo.com')
  })

  it('devuelve un error por campo', () => {
    const r = validarPedido({ ...valido, celular: '123', barrio: '' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errores).toEqual({ celular: MENSAJES.celularInvalido, barrio: MENSAJES.barrioVacio })
  })
})

describe('leerCampos', () => {
  it('ignora lo que no es texto y lo que no es un campo', () => {
    const c = leerCampos({ nombre: 'Ana Gómez', celular: 3001234567, precio: 1, metodoPago: ['x'] })
    expect(c.nombre).toBe('Ana Gómez')
    expect(c.celular).toBe('')
    expect(c.metodoPago).toBe('')
    expect(c).not.toHaveProperty('precio')
  })

  it('no explota con basura', () => {
    expect(leerCampos(null)).toEqual(CAMPOS_VACIOS)
    expect(leerCampos('hola')).toEqual(CAMPOS_VACIOS)
  })
})

describe('cuentas', () => {
  it('limita la cantidad a 1..10', () => {
    expect(limitarCantidad(0)).toBe(1)
    expect(limitarCantidad(-3)).toBe(1)
    expect(limitarCantidad(2.7)).toBe(2)
    expect(limitarCantidad(99)).toBe(10)
    expect(limitarCantidad('5')).toBe(1)
    expect(limitarCantidad(Number.NaN)).toBe(1)
  })

  it('el descuento no toca el envio', () => {
    expect(descuentoConPorcentaje(200000, 10)).toBe(20000)
    expect(totalDe({ subtotal: 200000, envio: 14000, descuento: 20000 })).toBe(194000)
  })

  it('saluda por el primer nombre', () => {
    expect(primerNombre('  Daniela  Restrepo ')).toBe('Daniela')
  })
})

describe('colombia', () => {
  it('trae los 32 departamentos y Bogota D.C.', () => {
    expect(DEPARTAMENTOS).toHaveLength(33)
    expect(new Set(DEPARTAMENTOS.map((d) => d.nombre)).size).toBe(33)
  })

  it('ningun departamento queda sin municipios ni con repetidos', () => {
    for (const d of DEPARTAMENTOS) {
      expect(d.municipios.length).toBeGreaterThan(0)
      expect(new Set(d.municipios).size).toBe(d.municipios.length)
    }
  })

  it('todas las ciudades metro por defecto existen en Antioquia', () => {
    for (const c of CONFIG_POR_DEFECTO.ciudadesMetro) expect(esMunicipioDe('Antioquia', c.split(',')[0].trim())).toBe(true)
  })

  it('un departamento que no existe no tiene municipios', () => {
    expect(municipiosDe('Narnia')).toEqual([])
  })
})
