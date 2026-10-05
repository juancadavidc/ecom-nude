/**
 * Reglas de subida de fotos que se pueden revisar sin leer la imagen. Viven
 * aparte de `fotos-proceso.ts` (que importa sharp) para que el navegador las
 * aplique antes de enviar: una foto de 20 MB se rechaza sin subirla.
 */

export const MAX_BYTES = 15 * 1024 * 1024
export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export function esHeic(nombre: string, tipo: string) {
  return /\.(heic|heif)$/i.test(nombre) || tipo === 'image/heic' || tipo === 'image/heif'
}

export const MENSAJE_HEIC =
  'Esta foto está en formato HEIC del iPhone y el servidor no la puede leer. En el iPhone ve a Ajustes, Cámara, Formatos y elige "Más compatible", o compártela como JPG.'

/** Validacion previa con lo que se sabe sin leer la imagen. null si pasa. */
export function validarArchivo(nombre: string, tipo: string, tamano: number): string | null {
  if (tamano === 0) return `"${nombre}" está vacía. Vuelve a elegirla.`
  if (tamano > MAX_BYTES) {
    const mb = (tamano / 1024 / 1024).toFixed(1).replace('.', ',')
    return `"${nombre}" pesa ${mb} MB y el máximo es 15 MB. Recórtala o envíatela por WhatsApp para que llegue más liviana.`
  }
  if (tipo && !TIPOS_ACEPTADOS.includes(tipo) && !esHeic(nombre, tipo)) {
    return `"${nombre}" no es una foto JPG, PNG o WebP. Elige otra.`
  }
  return null
}
