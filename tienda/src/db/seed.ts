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
  precio: number
  descripcion: string
  detalles: string[]
  estado: EstadoProducto
  combina_con: string[]
  imagenes: Record<string, string[]>
  variantes: { color: string; hex: string; talla: Talla; sku: string; stock: number }[]
  seo: { titulo: string; descripcion: string; alt: string }
}

const catalogo = archivo.productos as ProductoJson[]

/**
 * Vacia y vuelve a llenar las cuatro tablas de negocio desde
 * `src/content/productos.json`. El JSON deja de ser fuente de verdad y queda solo
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
        precio: p.precio,
        descripcion: p.descripcion,
        detalles: p.detalles,
        estado: p.estado,
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
