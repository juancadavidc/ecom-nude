'use server'

import { revalidatePath } from 'next/cache'
import { guardarConfig } from '@/lib/config'
import { leerCiudades, leerCodigos, leerCuentas, leerTarifas, leerWhatsapp } from './config-form'
import { exito, fallo, type Resultado } from './resultado'
import { exigirAdmin } from './sesion'

/** Un formulario por seccion: cada uno se guarda solo, con su propio aviso. */
export async function guardarSeccionConfig(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const seccion = String(formData.get('seccion') ?? '')

  try {
    switch (seccion) {
      case 'tarifasEnvio': {
        const r = leerTarifas(formData)
        if (!r.ok) return fallo('Revisa las tarifas.', r.errores)
        await guardarConfig('tarifasEnvio', r.valor)
        break
      }
      case 'ciudadesMetro': {
        const r = leerCiudades(formData)
        if (!r.ok) return fallo('Revisa la lista de ciudades.', r.errores)
        await guardarConfig('ciudadesMetro', r.valor)
        break
      }
      case 'datosPago': {
        const r = leerCuentas(formData)
        if (!r.ok) return fallo('Revisa las cuentas marcadas.', r.errores)
        await guardarConfig('datosPago', r.valor)
        break
      }
      case 'whatsapp': {
        const r = leerWhatsapp(formData)
        if (!r.ok) return fallo('Revisa el número.', r.errores)
        await guardarConfig('whatsapp', r.valor)
        break
      }
      case 'codigosDescuento': {
        const r = leerCodigos(formData)
        if (!r.ok) return fallo('Revisa los códigos marcados.', r.errores)
        await guardarConfig('codigosDescuento', r.valor)
        break
      }
      default:
        return fallo('Esa sección no existe. Recarga la página.')
    }
  } catch (e) {
    console.error('guardarSeccionConfig', e)
    return fallo('No se pudo guardar. Inténtalo de nuevo en un momento.')
  }

  // La configuracion la lee el checkout: se invalida todo el sitio.
  revalidatePath('/', 'layout')
  return exito('Guardado. El checkout ya usa estos datos.')
}
