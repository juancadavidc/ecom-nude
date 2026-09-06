import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrazoColumna } from '@/components/motion/Trazo'
import { Galeria } from '@/components/producto/Galeria'
import { MigaDePan } from '@/components/producto/MigaDePan'
import { VarianteProvider } from '@/components/producto/Variante'
import { formatCOP } from '@/lib/format'
import { esCategoria } from '@/lib/producto-modelo'
import { listarProductos, obtenerProducto } from '@/lib/productos'

/**
 * Ficha de producto. La pagina mas importante del sitio: aqui se decide la
 * compra (SPEC §4.3).
 *
 * `generateStaticParams` devuelve los dos segmentos desde la hoja, que es lo que
 * permite prerenderizar las ocho fichas con `output: 'export'`.
 */
export const dynamicParams = false

export async function generateStaticParams() {
  const { productos } = await listarProductos()
  return productos.map((p) => ({ categoria: p.categoria, slug: p.slug }))
}

type Props = { params: Promise<{ categoria: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const producto = await obtenerProducto(slug)
  if (!producto) return {}
  return {
    title: producto.seo.titulo,
    description: producto.seo.descripcion,
    openGraph: { title: producto.seo.titulo, description: producto.seo.descripcion },
  }
}

export default async function FichaPage({ params }: Props) {
  const { categoria, slug } = await params
  const producto = await obtenerProducto(slug)

  // El slug manda sobre el segmento de categoria: /tops/legging-duna no existe.
  if (!producto || !esCategoria(categoria) || producto.categoria !== categoria) notFound()

  return (
    <article className="container-nude ficha-pagina">
      <MigaDePan categoria={producto.categoria} nombre={producto.nombre} />

      <VarianteProvider producto={producto}>
        <div className="ficha">
          <div className="ficha-galeria">
            <Galeria alt={producto.seo.alt} />
          </div>

          <div className="ficha-compra">
            {/* El trazo baja por el borde izquierdo: de la foto al boton (§11.1) */}
            <div className="ficha-trazo" aria-hidden="true">
              <TrazoColumna alto="100%" />
            </div>

            <div className="ficha-bloque">
              <h1 className="ficha-nombre">{producto.nombre}</h1>
              <p className="price">{formatCOP(producto.precio)}</p>
            </div>
          </div>
        </div>
      </VarianteProvider>
    </article>
  )
}
