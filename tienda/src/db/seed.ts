import 'dotenv/config'
import archivo from '../content/productos.json'
import type { Categoria, EstadoProducto, Talla } from '../lib/producto-modelo'
import { db } from './index'
import { combinaCon, imagenes, productos, variantes } from './schema'

type ProductoJson = {
  nombre: string
  slug: string
  categoria: Categoria
  coleccion: string
  marca: string | null
  precio: number
  descripcion: string
  detalles: string[]
  estado: EstadoProducto
  destacado: boolean
  combina_con: string[]
  imagenes: Record<string, string[]>
  variantes: { color: string; hex: string; talla: Talla; sku: string; disponible: boolean; precio: number | null }[]
  seo: { titulo: string; descripcion: string; alt: string }
}

const catalogo = archivo.productos as unknown as ProductoJson[]

/**
 * Vacia y vuelve a llenar las cuatro tablas de catalogo desde
 * `src/content/productos.json` — el catalogo real, armado a partir del listado
 * de productos (Productos_20261005_1445.xlsx) y las fotos de la sesion. Las
 * categorias no se tocan: las crea la migracion 0001 y se editan en el panel. El JSON deja de ser fuente de verdad y queda solo
 * como semilla. Se corre en tres pasadas porque `combina_con` necesita que todos
 * los productos existan primero, y `creadoEn` recibe timestamps que preservan el
 * orden del archivo (asi el orden por defecto -- "novedad" -- sigue siendo el
 * orden del array, igual que en el mock).
 */
export async function seed() {
  await db.delete(combinaCon)
  await db.delete(imagenes)
  await db.delete(variantes)
  await db.delete(productos)

  const slugAId = new Map<string, string>()
  const base = Date.now()

  for (const [i, p] of catalogo.entries()) {
    const [fila] = await db
      .insert(productos)
      .values({
        slug: p.slug,
        nombre: p.nombre,
        categoria: p.categoria,
        coleccion: p.coleccion,
        marca: p.marca,
        precio: p.precio,
        descripcion: p.descripcion,
        detalles: p.detalles,
        estado: p.estado,
        destacado: p.destacado,
        seoTitulo: p.seo.titulo,
        seoDescripcion: p.seo.descripcion,
        seoAlt: p.seo.alt,
        creadoEn: new Date(base + i),
      })
      .returning({ id: productos.id })
    slugAId.set(p.slug, fila.id)
  }

  for (const p of catalogo) {
    const productoId = slugAId.get(p.slug)!

    if (p.variantes.length) {
      await db.insert(variantes).values(p.variantes.map((v) => ({ productoId, ...v })))
    }

    const filasImagenes = Object.entries(p.imagenes).flatMap(([color, rutas]) =>
      rutas.map((ruta, orden) => ({ productoId, color, ruta, orden })),
    )
    if (filasImagenes.length) await db.insert(imagenes).values(filasImagenes)
  }

  for (const p of catalogo) {
    const productoId = slugAId.get(p.slug)!
    const filas = p.combina_con.map((otro, orden) => ({
      productoId,
      combinaConId: slugAId.get(otro)!,
      orden,
    }))
    if (filas.length) await db.insert(combinaCon).values(filas)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // En produccion la semilla BORRA el catalogo que se edito desde /admin. Se
  // corre una sola vez, en el primer despliegue con el catalogo real, y a
  // proposito, dentro del contenedor: SEMBRAR_CATALOGO=si node seed.mjs
  if (process.env.NODE_ENV === 'production' && process.env.SEMBRAR_CATALOGO !== 'si') {
    console.error('La semilla reemplaza todo el catalogo. En produccion: SEMBRAR_CATALOGO=si node seed.mjs')
    process.exit(1)
  }
  seed()
    .then(() => {
      console.log(`Seed OK: ${catalogo.length} productos.`)
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
