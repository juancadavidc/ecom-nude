import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { config as configTabla } from '@/db/schema'

/**
 * Parametros de la operacion que se cambian desde /admin/configuracion sin
 * desplegar (SPEC §4.5 y §9.3). Viven en la tabla `config`, una fila por clave.
 *
 * Cada clave tiene un valor por defecto: una base recien migrada funciona sin
 * que nadie haya entrado al panel, y una fila con forma equivocada (editada a
 * mano, o de otra version) cae al defecto en vez de tumbar el checkout.
 */

export type TarifasEnvio = {
  /** Area metropolitana. SPEC §4.5. */
  metro: number
  /** Resto del pais. */
  nacional: number
}

export type DatosPago = {
  /** Lo que se muestra en grande en la confirmacion de un pedido por transferencia. */
  cuentas: { banco: string; tipo: string; numero: string; titular: string }[]
}

export type CodigoDescuento = {
  codigo: string
  /** Porcentaje entero sobre el subtotal (sin envio). */
  porcentaje: number
  activo: boolean
}

export type Config = {
  tarifasEnvio: TarifasEnvio
  ciudadesMetro: string[]
  datosPago: DatosPago
  /** Numero con indicativo, solo digitos: 573001234567. */
  whatsapp: string
  codigosDescuento: CodigoDescuento[]
}

export const CONFIG_POR_DEFECTO: Config = {
  tarifasEnvio: { metro: 14000, nacional: 20000 },
  // SPEC §4.5 — lista inicial. Decision abierta 2: confirmarla con la transportadora.
  // "Ciudad, Departamento": el departamento desambigua municipios homonimos
  // (Barbosa, Antioquia es metropolitana; Barbosa, Santander no).
  ciudadesMetro: [
    'Medellín, Antioquia',
    'Envigado, Antioquia',
    'Itagüí, Antioquia',
    'Sabaneta, Antioquia',
    'Bello, Antioquia',
    'La Estrella, Antioquia',
    'Caldas, Antioquia',
    'Copacabana, Antioquia',
    'Girardota, Antioquia',
    'Barbosa, Antioquia',
  ],
  // Decision abierta 6: la cuenta real se carga desde el panel.
  datosPago: { cuentas: [] },
  // TODO: numero real. Hoy es el placeholder de src/lib/site.ts.
  whatsapp: '573000000000',
  codigosDescuento: [{ codigo: 'SECONDSKIN', porcentaje: 10, activo: true }],
}

export type ClaveConfig = keyof Config

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Validadores minimos: si la fila no tiene la forma esperada, se usa el defecto. */
const VALIDO: { [K in ClaveConfig]: (v: unknown) => v is Config[K] } = {
  tarifasEnvio: (v): v is TarifasEnvio =>
    esObjeto(v) && Number.isInteger(v.metro) && Number.isInteger(v.nacional),
  ciudadesMetro: (v): v is string[] => Array.isArray(v) && v.every((c) => typeof c === 'string'),
  datosPago: (v): v is DatosPago =>
    esObjeto(v) &&
    Array.isArray(v.cuentas) &&
    v.cuentas.every(
      (c) =>
        esObjeto(c) &&
        typeof c.banco === 'string' &&
        typeof c.tipo === 'string' &&
        typeof c.numero === 'string' &&
        typeof c.titular === 'string',
    ),
  whatsapp: (v): v is string => typeof v === 'string' && /^\d{8,15}$/.test(v),
  codigosDescuento: (v): v is CodigoDescuento[] =>
    Array.isArray(v) &&
    v.every(
      (c) =>
        esObjeto(c) &&
        typeof c.codigo === 'string' &&
        Number.isInteger(c.porcentaje) &&
        (c.porcentaje as number) > 0 &&
        (c.porcentaje as number) <= 100 &&
        typeof c.activo === 'boolean',
    ),
}

export async function leerConfig(): Promise<Config> {
  const filas = await db.select().from(configTabla)
  const resultado = structuredClone(CONFIG_POR_DEFECTO)
  for (const fila of filas) {
    const clave = fila.clave as ClaveConfig
    if (clave in VALIDO && VALIDO[clave](fila.valor)) {
      ;(resultado as Record<ClaveConfig, unknown>)[clave] = fila.valor
    }
  }
  return resultado
}

/** Guarda una clave. Lanza si el valor no tiene la forma de esa clave. */
export async function guardarConfig<K extends ClaveConfig>(clave: K, valor: Config[K]): Promise<void> {
  if (!VALIDO[clave](valor)) throw new Error(`Valor invalido para la configuracion "${clave}"`)
  await db
    .insert(configTabla)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: configTabla.clave, set: { valor, actualizadoEn: new Date() } })
}

export async function leerClave<K extends ClaveConfig>(clave: K): Promise<Config[K]> {
  const [fila] = await db.select().from(configTabla).where(eq(configTabla.clave, clave)).limit(1)
  return fila && VALIDO[clave](fila.valor) ? fila.valor : structuredClone(CONFIG_POR_DEFECTO[clave])
}

/** Normaliza para comparar ciudades: sin tildes, sin mayusculas, sin espacios de mas. */
export function normalizarCiudad(ciudad: string): string {
  return ciudad
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

/** "Medellín, Antioquia" → { ciudad: "Medellín", departamento: "Antioquia" }. El departamento es opcional. */
export function partirCiudadMetro(entrada: string): { ciudad: string; departamento: string | null } {
  const [ciudad, ...resto] = entrada.split(',')
  const departamento = resto.join(',').trim()
  return { ciudad: ciudad.trim(), departamento: departamento || null }
}

/**
 * Tarifa de envio para una ciudad (SPEC §4.5). Nunca hay envio gratis. Una
 * entrada de la lista con departamento solo coincide en ese departamento; sin
 * departamento coincide en cualquiera (asi se escribia la lista antes).
 */
export function envioPara(
  ciudad: string,
  cfg: Pick<Config, 'tarifasEnvio' | 'ciudadesMetro'>,
  departamento?: string,
): number {
  const metro = cfg.ciudadesMetro.some((entrada) => {
    const e = partirCiudadMetro(entrada)
    if (normalizarCiudad(e.ciudad) !== normalizarCiudad(ciudad)) return false
    return !e.departamento || !departamento || normalizarCiudad(e.departamento) === normalizarCiudad(departamento)
  })
  return metro ? cfg.tarifasEnvio.metro : cfg.tarifasEnvio.nacional
}

/** Descuento en COP sobre el subtotal. 0 si el codigo no existe o esta apagado. */
export function descuentoPara(codigo: string | null | undefined, subtotal: number, codigos: CodigoDescuento[]): number {
  if (!codigo) return 0
  const c = codigos.find((x) => x.activo && x.codigo.toUpperCase() === codigo.trim().toUpperCase())
  return c ? Math.round((subtotal * c.porcentaje) / 100) : 0
}
