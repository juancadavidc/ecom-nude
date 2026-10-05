import type { CodigoDescuento, Config, DatosPago, TarifasEnvio } from '@/lib/config'

/**
 * Lectura y validacion de los formularios de /admin/configuracion. Puro: cada
 * funcion devuelve el valor listo para `guardarConfig` o los errores por campo.
 */

type Leido<T> = { ok: true; valor: T } | { ok: false; errores: Record<string, string> }

function pesos(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').replace(/[.\s$]/g, '')
  return /^\d+$/.test(s) ? Number(s) : null
}

export function leerTarifas(fd: FormData): Leido<TarifasEnvio> {
  const metro = pesos(fd.get('metro'))
  const nacional = pesos(fd.get('nacional'))
  const errores: Record<string, string> = {}
  if (metro === null || metro <= 0) errores.metro = 'Escribe la tarifa en pesos, sin puntos: 14000.'
  if (nacional === null || nacional <= 0) errores.nacional = 'Escribe la tarifa en pesos, sin puntos: 20000.'
  if (Object.keys(errores).length) return { ok: false, errores }
  return { ok: true, valor: { metro: metro!, nacional: nacional! } }
}

export function leerCiudades(fd: FormData): Leido<string[]> {
  const ciudades = [
    ...new Set(
      String(fd.get('ciudades') ?? '')
        .split('\n')
        .map((c) => c.trim().replace(/\s+/g, ' '))
        .filter(Boolean),
    ),
  ]
  if (!ciudades.length) return { ok: false, errores: { ciudades: 'Escribe al menos una ciudad, una por línea.' } }
  return { ok: true, valor: ciudades }
}

/** Solo digitos, con indicativo. Un celular de 10 digitos recibe el 57. */
export function leerWhatsapp(fd: FormData): Leido<string> {
  let n = String(fd.get('whatsapp') ?? '').replace(/\D/g, '')
  if (n.length === 10 && n.startsWith('3')) n = `57${n}`
  if (!/^\d{8,15}$/.test(n)) {
    return { ok: false, errores: { whatsapp: 'Escribe el número con indicativo, por ejemplo 573001234567.' } }
  }
  return { ok: true, valor: n }
}

function json(fd: FormData, campo: string): unknown {
  try {
    return JSON.parse(String(fd.get(campo) ?? ''))
  } catch {
    return null
  }
}

export function leerCuentas(fd: FormData): Leido<DatosPago> {
  const crudo = json(fd, 'cuentas')
  if (!Array.isArray(crudo)) return { ok: false, errores: { cuentas: 'El formulario llegó incompleto. Recarga la página.' } }
  const errores: Record<string, string> = {}
  const cuentas = crudo.map((c, i) => {
    const o = (typeof c === 'object' && c ? c : {}) as Record<string, unknown>
    const cuenta = {
      banco: String(o.banco ?? '').trim(),
      tipo: String(o.tipo ?? '').trim(),
      numero: String(o.numero ?? '').trim(),
      titular: String(o.titular ?? '').trim(),
    }
    if (!cuenta.banco) errores[`cuentas.${i}.banco`] = 'Escribe el banco o la billetera: Bancolombia, Nequi.'
    if (!cuenta.numero) errores[`cuentas.${i}.numero`] = 'Escribe el número de la cuenta o del celular.'
    else if (!/^[\d\s-]+$/.test(cuenta.numero)) errores[`cuentas.${i}.numero`] = 'Usa solo números, espacios o guiones.'
    if (!cuenta.titular) errores[`cuentas.${i}.titular`] = 'Escribe a nombre de quién está la cuenta.'
    return cuenta
  })
  if (Object.keys(errores).length) return { ok: false, errores }
  return { ok: true, valor: { cuentas } }
}

export function leerCodigos(fd: FormData): Leido<CodigoDescuento[]> {
  const crudo = json(fd, 'codigos')
  if (!Array.isArray(crudo)) return { ok: false, errores: { codigos: 'El formulario llegó incompleto. Recarga la página.' } }
  const errores: Record<string, string> = {}
  const vistos = new Set<string>()
  const codigos = crudo.map((c, i) => {
    const o = (typeof c === 'object' && c ? c : {}) as Record<string, unknown>
    const codigo = String(o.codigo ?? '').trim().toUpperCase()
    const porcentaje = Number(o.porcentaje)
    if (!/^[A-Z0-9_-]{3,30}$/.test(codigo)) {
      errores[`codigos.${i}.codigo`] = 'Usa de 3 a 30 letras o números, sin espacios: SECONDSKIN.'
    } else if (vistos.has(codigo)) {
      errores[`codigos.${i}.codigo`] = 'Este código está repetido.'
    }
    vistos.add(codigo)
    if (!Number.isInteger(porcentaje) || porcentaje < 1 || porcentaje > 90) {
      errores[`codigos.${i}.porcentaje`] = 'Escribe un porcentaje entero entre 1 y 90.'
    }
    return { codigo, porcentaje, activo: o.activo === true }
  })
  if (Object.keys(errores).length) return { ok: false, errores }
  return { ok: true, valor: codigos }
}

export const SECCIONES = ['tarifasEnvio', 'ciudadesMetro', 'datosPago', 'whatsapp', 'codigosDescuento'] as const
export type Seccion = (typeof SECCIONES)[number] & keyof Config
