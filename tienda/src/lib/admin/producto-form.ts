import { esTalla, TALLAS, type EstadoProducto, type Talla } from '@/lib/producto-modelo'
import { skusRepetidos, type ColorEditor, type VarianteEditor } from './variantes'

/**
 * Lo que el formulario de producto envia al servidor, y su validacion. Puro:
 * no toca la base. Lo que depende de la base (slug libre, SKU libre, categoria
 * existente, fotos guardadas) entra como contexto.
 */

export const ESTADOS_PRODUCTO = ['activo', 'agotado', 'proximamente', 'borrador'] as const satisfies readonly EstadoProducto[]

export const NOMBRE_ESTADO: Record<EstadoProducto, string> = {
  activo: 'Activo',
  agotado: 'Agotado',
  proximamente: 'Próximamente',
  borrador: 'Borrador',
}

export type ProductoPayload = {
  nombre: string
  slug: string
  categoria: string
  marca: string
  precio: number
  descripcion: string
  detalles: string[]
  estado: EstadoProducto
  destacado: boolean
  seo: { titulo: string; descripcion: string; alt: string }
  colores: ColorEditor[]
  tallas: Talla[]
  variantes: VarianteEditor[]
  /** Ids de otros productos, en orden. */
  combinaCon: string[]
}

export type ErroresProducto = Partial<Record<string, string>>

export type ContextoValidacion = {
  /** Fotos guardadas por nombre de color (el nombre en la base). */
  fotosPorColor: Record<string, number>
}

export const PRECIO_MAXIMO = 20_000_000
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX = /^#[0-9a-fA-F]{6}$/
const SKU = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** Defaults sensatos para el SEO a partir de lo que ya se escribio. */
export function seoPorDefecto(nombre: string, descripcion: string, categoriaNombre: string) {
  const desc = descripcion.trim().replace(/\s+/g, ' ')
  return {
    titulo: nombre.trim(),
    descripcion: desc.length > 160 ? `${desc.slice(0, 157).replace(/\s+\S*$/, '')}...` : desc,
    alt: [nombre.trim(), categoriaNombre && `de la categoría ${categoriaNombre.toLowerCase()}`]
      .filter(Boolean)
      .join(', '),
  }
}

/** Una linea, un detalle. Sin lineas vacias. */
export function detallesDeTexto(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function entero(v: unknown): number | null {
  if (typeof v === 'number' && Number.isInteger(v)) return v
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim())
  return null
}

function normalizarColor(v: unknown): ColorEditor | null {
  if (typeof v !== 'object' || v === null) return null
  const c = v as Record<string, unknown>
  const precio = c.precio === null || c.precio === '' || c.precio === undefined ? null : entero(c.precio)
  return {
    nombre: texto(c.nombre),
    hex: texto(c.hex),
    precio: precio === null && c.precio != null && c.precio !== '' ? NaN : precio,
    codigo: texto(c.codigo),
    original: typeof c.original === 'string' && c.original ? c.original : null,
  }
}

/**
 * Convierte el JSON del formulario en un payload tipado y lista los errores por
 * campo. Cada mensaje dice como resolverse (SPEC §12).
 */
export function validarProducto(
  crudo: unknown,
  ctx: ContextoValidacion,
): { ok: true; datos: ProductoPayload } | { ok: false; errores: ErroresProducto } {
  const errores: ErroresProducto = {}
  const d = (typeof crudo === 'object' && crudo !== null ? crudo : {}) as Record<string, unknown>

  const nombre = texto(d.nombre)
  if (!nombre) errores.nombre = 'Escribe el nombre del producto.'
  else if (nombre.length > 120) errores.nombre = 'El nombre es muy largo: déjalo en menos de 120 caracteres.'

  const slug = texto(d.slug).toLowerCase()
  if (!slug) errores.slug = 'Escribe la dirección web del producto.'
  else if (!SLUG.test(slug)) errores.slug = 'Usa solo letras sin tildes, números y guiones: "legging-rib-negro".'

  const categoria = texto(d.categoria)
  if (!categoria) errores.categoria = 'Elige una categoría.'

  const precio = entero(d.precio)
  if (precio === null || precio <= 0) errores.precio = 'Escribe el precio en pesos, sin puntos: 145000.'
  else if (precio > PRECIO_MAXIMO) errores.precio = 'Ese precio parece tener ceros de más. Revísalo.'

  const descripcion = texto(d.descripcion)
  if (!descripcion) errores.descripcion = 'Escribe una descripción: es lo que lee la clienta en la ficha.'

  const detalles = Array.isArray(d.detalles) ? d.detalles.map(texto).filter(Boolean) : []

  const estado = ESTADOS_PRODUCTO.find((e) => e === d.estado)
  if (!estado) errores.estado = 'Elige un estado.'

  const seoCrudo = (typeof d.seo === 'object' && d.seo !== null ? d.seo : {}) as Record<string, unknown>
  const seo = { titulo: texto(seoCrudo.titulo), descripcion: texto(seoCrudo.descripcion), alt: texto(seoCrudo.alt) }
  if (!seo.titulo) errores['seo.titulo'] = 'Escribe el título para buscadores. Puede ser el mismo nombre.'
  if (!seo.descripcion) errores['seo.descripcion'] = 'Escribe la descripción para buscadores.'
  if (!seo.alt) errores['seo.alt'] = 'Describe la foto para quien no la ve: prenda, color y tela.'

  // Colores
  const colores = (Array.isArray(d.colores) ? d.colores : []).map(normalizarColor)
  if (!colores.length) errores.colores = 'Agrega al menos un color.'
  const nombresVistos = new Set<string>()
  colores.forEach((c, i) => {
    if (!c) {
      errores[`colores.${i}`] = 'Este color llegó incompleto. Bórralo y agrégalo de nuevo.'
      return
    }
    if (!c.nombre) errores[`colores.${i}.nombre`] = 'Ponle nombre al color, como lo ve la clienta: "Café".'
    else if (nombresVistos.has(c.nombre.toLowerCase()))
      errores[`colores.${i}.nombre`] = `Ya hay un color llamado "${c.nombre}". Usa otro nombre.`
    nombresVistos.add(c.nombre.toLowerCase())
    if (!HEX.test(c.hex)) errores[`colores.${i}.hex`] = 'Elige el tono del color.'
    if (c.precio !== null) {
      if (!Number.isInteger(c.precio) || c.precio <= 0)
        errores[`colores.${i}.precio`] = 'Escribe el precio en pesos, sin puntos, o déjalo vacío.'
      else if (precio !== null && c.precio < precio)
        errores[`colores.${i}.precio`] =
          'El precio de un color no puede ser menor que el precio base. Baja el precio base o sube este.'
    }
  })

  // Un color que se quita con fotos dejaria fotos huerfanas.
  const originalesQueQuedan = new Set(colores.map((c) => c?.original).filter(Boolean))
  for (const [color, n] of Object.entries(ctx.fotosPorColor)) {
    if (n > 0 && !originalesQueQuedan.has(color)) {
      errores.colores = `El color "${color}" tiene ${n === 1 ? 'una foto' : `${n} fotos`}. Muévelas a otro color o bórralas antes de quitarlo.`
    }
  }

  // Tallas
  const tallas = TALLAS.filter((t) => Array.isArray(d.tallas) && d.tallas.includes(t))
  if (!tallas.length) errores.tallas = 'Elige al menos una talla.'

  // Variantes: exactamente color × talla, cada una con SKU valido y unico.
  const variantes: VarianteEditor[] = []
  for (const v of Array.isArray(d.variantes) ? d.variantes : []) {
    if (typeof v !== 'object' || v === null) continue
    const r = v as Record<string, unknown>
    const talla = texto(r.talla)
    if (!esTalla(talla)) continue
    variantes.push({ color: texto(r.color), talla, sku: texto(r.sku), disponible: r.disponible !== false })
  }
  if (!errores.colores && !errores.tallas) {
    for (const c of colores) {
      if (!c) continue
      for (const t of tallas) {
        const v = variantes.find((x) => x.color === c.nombre && x.talla === t)
        if (!v) {
          errores.variantes = `Falta la talla ${t} del color ${c.nombre}. Recarga la página e inténtalo de nuevo.`
        } else if (!SKU.test(v.sku)) {
          errores.variantes = `El SKU de ${c.nombre} ${t} no es válido: usa letras, números y guiones.`
        }
      }
    }
    const repetidos = skusRepetidos(variantes)
    if (repetidos.length) errores.variantes = `El SKU ${repetidos[0]} está repetido. Cada talla de cada color necesita uno distinto.`
  }

  // Regla de publicacion: no se activa un producto sin fotos.
  const totalFotos = Object.entries(ctx.fotosPorColor)
    .filter(([color]) => originalesQueQuedan.has(color))
    .reduce((s, [, n]) => s + n, 0)
  if (estado === 'activo' && totalFotos === 0) {
    errores.estado = motivoSinFotos()
  }

  const combinaCon = Array.isArray(d.combinaCon)
    ? [...new Set(d.combinaCon.filter((x): x is string => typeof x === 'string' && x.length > 0))]
    : []

  if (Object.keys(errores).length) return { ok: false, errores }

  return {
    ok: true,
    datos: {
      nombre,
      slug,
      categoria,
      marca: texto(d.marca),
      precio: precio!,
      descripcion,
      detalles,
      estado: estado!,
      destacado: d.destacado === true,
      seo,
      colores: (colores as ColorEditor[]).map((c) => ({ ...c, precio: c.precio === precio ? null : c.precio })),
      tallas,
      variantes: variantes
        .filter((v) => colores.some((c) => c?.nombre === v.color) && tallas.includes(v.talla))
        .map((v) => ({ ...v, sku: v.sku.trim() })),
      combinaCon,
    },
  }
}

export function motivoSinFotos(): string {
  return 'Para publicarlo como activo necesita al menos una foto. Súbela abajo, en Fotos, o déjalo en borrador.'
}

/** El producto puede quedar activo solo si tiene al menos una foto. */
export function puedeActivarse(totalFotos: number): boolean {
  return totalFotos > 0
}
