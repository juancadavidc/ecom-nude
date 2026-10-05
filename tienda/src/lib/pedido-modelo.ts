import { esMunicipioDe } from './colombia'

/**
 * Vocabulario del pedido: tipos, validación de campos y cuentas. Puro, sin `@/db`.
 *
 * Vive aparte de `pedidos.ts` por la misma razón que `producto-modelo.ts` vive
 * aparte de `productos.ts`: el checkout valida al salir de cada campo (SPEC §12)
 * en el cliente, y el servidor valida otra vez con estas mismas funciones. Si
 * vivieran en `pedidos.ts`, el cliente arrastraría el driver de Postgres.
 *
 * Todo mensaje de error dice cómo resolverse, no solo qué falló (SPEC §7, §12).
 */

export type MetodoPago = 'transferencia' | 'contraentrega'

export const METODOS_PAGO: readonly MetodoPago[] = ['transferencia', 'contraentrega']

export function esMetodoPago(v: unknown): v is MetodoPago {
  return v === 'transferencia' || v === 'contraentrega'
}

/** Lo que llena la clienta, tal cual llega del formulario. */
export type CamposPedido = {
  nombre: string
  celular: string
  correo: string
  departamento: string
  ciudad: string
  direccion: string
  barrio: string
  indicaciones: string
  metodoPago: string
}

export type CampoPedido = keyof CamposPedido
export type ErroresCampos = Partial<Record<CampoPedido | 'codigo', string>>

/** Ya validado y normalizado: lo que se guarda. */
export type DatosPedido = Omit<CamposPedido, 'metodoPago'> & { metodoPago: MetodoPago }

export const CAMPOS_VACIOS: CamposPedido = {
  nombre: '',
  celular: '',
  correo: '',
  departamento: '',
  ciudad: '',
  direccion: '',
  barrio: '',
  indicaciones: '',
  metodoPago: '',
}

/** Orden visual del formulario: el primer error de esta lista recibe el foco. */
export const ORDEN_CAMPOS: readonly CampoPedido[] = [
  'nombre',
  'celular',
  'correo',
  'departamento',
  'ciudad',
  'direccion',
  'barrio',
  'indicaciones',
  'metodoPago',
]

export const LARGO_MAXIMO: Record<CampoPedido, number> = {
  nombre: 120,
  celular: 20,
  correo: 160,
  departamento: 60,
  ciudad: 60,
  direccion: 200,
  barrio: 120,
  indicaciones: 300,
  metodoPago: 20,
}

/** Tope por línea: nadie compra once leggings iguales; si pasa, se escribe por WhatsApp. */
export const CANTIDAD_MAXIMA = 10
/** Tope de líneas distintas por pedido. Acota la consulta de un payload hostil. */
export const LINEAS_MAXIMAS = 30

export function limitarCantidad(n: unknown): number {
  const entero = typeof n === 'number' && Number.isFinite(n) ? Math.trunc(n) : 1
  return Math.min(CANTIDAD_MAXIMA, Math.max(1, entero))
}

/**
 * Celular colombiano: 10 dígitos que empiezan por 3. Acepta lo que la gente
 * escribe de verdad — espacios, guiones, paréntesis, +57 o 57 adelante — y
 * devuelve solo los 10 dígitos. null si no es un celular.
 */
export function normalizarCelular(valor: string): string | null {
  let d = valor.replace(/[\s\-().]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  if (!/^\d+$/.test(d)) return null
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2)
  return /^3\d{9}$/.test(d) ? d : null
}

/** "3001234567" -> "300 123 4567", como se dicta un número en Colombia. */
export function formatoCelular(celular: string): string {
  return /^\d{10}$/.test(celular) ? `${celular.slice(0, 3)} ${celular.slice(3, 6)} ${celular.slice(6)}` : celular
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const limpio = (v: string) => v.replace(/\s+/g, ' ').trim()

export const MENSAJES = {
  nombreVacio: 'Nos falta tu nombre para saber a quién entregar.',
  nombreIncompleto: 'Escribe también tu apellido: así va en la guía de envío.',
  celularVacio: 'Nos falta tu celular para coordinar la entrega.',
  celularInvalido: 'Revisa el celular: son 10 dígitos y empieza por 3.',
  correoVacio: 'Nos falta tu correo para enviarte la confirmación.',
  correoInvalido: 'Revisa el correo: parece que le falta algo.',
  departamentoVacio: 'Elige el departamento al que enviamos.',
  ciudadVacia: 'Elige la ciudad o municipio para calcular el envío.',
  ciudadInvalida: 'Elige una ciudad de la lista de ese departamento.',
  direccionVacia: 'Nos falta la dirección para que la transportadora llegue.',
  direccionCorta: 'Revisa la dirección: incluye calle o carrera, número y apartamento si aplica.',
  barrioVacio: 'Nos falta el barrio: la transportadora lo pide para ubicarte.',
  metodoPagoVacio: 'Elige cómo quieres pagar.',
  demasiadoLargo: 'Es más largo de lo que podemos guardar. Acórtalo un poco.',
  codigoInvalido: 'Ese código no existe o ya no está activo. Revisa cómo lo escribiste.',
} as const

/** Error de un campo, o undefined si está bien. Lo usan el blur del cliente y el servidor. */
export function validarCampo(campo: CampoPedido, valores: CamposPedido): string | undefined {
  const v = limpio(valores[campo] ?? '')
  if (v.length > LARGO_MAXIMO[campo]) return MENSAJES.demasiadoLargo
  switch (campo) {
    case 'nombre':
      if (!v) return MENSAJES.nombreVacio
      if (v.split(' ').filter((p) => p.length > 1).length < 2) return MENSAJES.nombreIncompleto
      return
    case 'celular':
      if (!v) return MENSAJES.celularVacio
      return normalizarCelular(v) ? undefined : MENSAJES.celularInvalido
    case 'correo':
      if (!v) return MENSAJES.correoVacio
      return CORREO.test(v) ? undefined : MENSAJES.correoInvalido
    case 'departamento':
      return v ? undefined : MENSAJES.departamentoVacio
    case 'ciudad':
      if (!v) return MENSAJES.ciudadVacia
      return esMunicipioDe(limpio(valores.departamento), v) ? undefined : MENSAJES.ciudadInvalida
    case 'direccion':
      if (!v) return MENSAJES.direccionVacia
      return v.length < 6 || !/\d/.test(v) ? MENSAJES.direccionCorta : undefined
    case 'barrio':
      return v ? undefined : MENSAJES.barrioVacio
    case 'indicaciones':
      return
    case 'metodoPago':
      return esMetodoPago(v) ? undefined : MENSAJES.metodoPagoVacio
  }
}

export type ResultadoValidacion =
  | { ok: true; datos: DatosPedido }
  | { ok: false; errores: ErroresCampos }

/** Valida todo y, si pasa, devuelve los datos normalizados listos para guardar. */
export function validarPedido(valores: CamposPedido): ResultadoValidacion {
  const errores: ErroresCampos = {}
  for (const campo of ORDEN_CAMPOS) {
    const error = validarCampo(campo, valores)
    if (error) errores[campo] = error
  }
  if (Object.keys(errores).length) return { ok: false, errores }
  return {
    ok: true,
    datos: {
      nombre: limpio(valores.nombre),
      celular: normalizarCelular(valores.celular)!,
      correo: limpio(valores.correo).toLowerCase(),
      departamento: limpio(valores.departamento),
      ciudad: limpio(valores.ciudad),
      direccion: limpio(valores.direccion),
      barrio: limpio(valores.barrio),
      indicaciones: valores.indicaciones.trim(),
      metodoPago: limpio(valores.metodoPago) as MetodoPago,
    },
  }
}

/** Lee un payload desconocido como campos de texto. Lo que no sea string queda vacío. */
export function leerCampos(entrada: unknown): CamposPedido {
  const fuente = typeof entrada === 'object' && entrada !== null ? (entrada as Record<string, unknown>) : {}
  const campos = { ...CAMPOS_VACIOS }
  for (const campo of ORDEN_CAMPOS) {
    const v = fuente[campo]
    // Se corta a un margen holgado antes de validar: el largo real lo juzga validarCampo.
    if (typeof v === 'string') campos[campo] = v.slice(0, LARGO_MAXIMO[campo] * 2)
  }
  return campos
}

/** Descuento sobre el subtotal, con la misma cuenta que `descuentoPara` de config.ts. */
export function descuentoConPorcentaje(subtotal: number, porcentaje: number): number {
  return Math.round((subtotal * porcentaje) / 100)
}

export function totalDe({ subtotal, envio, descuento }: { subtotal: number; envio: number; descuento: number }): number {
  return Math.max(0, subtotal - descuento) + envio
}

/** Primer nombre, para saludar sin repetir el nombre completo. */
export function primerNombre(nombre: string): string {
  return limpio(nombre).split(' ')[0] ?? ''
}
