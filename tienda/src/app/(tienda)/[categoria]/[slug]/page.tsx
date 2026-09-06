import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Reveal } from '@/components/motion/Reveal'
import { TrazoColumna } from '@/components/motion/Trazo'
import { BarraCompra } from '@/components/producto/BarraCompra'
import { Galeria } from '@/components/producto/Galeria'
import { GridProducto } from '@/components/producto/GridProducto'
import { MigaDePan } from '@/components/producto/MigaDePan'
import {
  AvisoInventario,
  BotonAgregar,
  PanelConfirmacion,
  SelectorColor,
  SelectorTalla,
  SkuActivo,
} from '@/components/producto/SelectorVariante'
import { VarianteProvider } from '@/components/producto/Variante'
import { Acordeon, ItemAcordeon } from '@/components/ui/Acordeon'
import { Truck, Wallet } from '@/components/ui/icons'
import { politicas } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import { esCategoria } from '@/lib/producto-modelo'
import { combinaCon, listarProductos, obtenerProducto } from '@/lib/productos'

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
  const relacionados = await combinaCon(slug)

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
              <SkuActivo />
            </div>

            <div className="ficha-bloque">
              <p className="price">{formatCOP(producto.precio)}</p>
              {/* Aporte de la referencia: el pago, a la altura del precio */}
              <div className="ficha-pagos body-s">
                <span className="ficha-pago">
                  <Truck size={16} weight="light" aria-hidden="true" />
                  Pago contra entrega
                </span>
                <span className="ficha-pago">
                  <Wallet size={16} weight="light" aria-hidden="true" />
                  Nequi o Bancolombia
                </span>
              </div>
            </div>

            <SelectorColor />
            <SelectorTalla />
            <AvisoInventario />
            <BotonAgregar />
          </div>
        </div>

        <section className="ficha-detalle eje">
          <div className="ficha-detalle-texto">
            <p className="body measure">{producto.descripcion}</p>

            <div className="ficha-bloque">
              <h2 className="label text-muted">Detalles</h2>
              <ul className="body-s text-muted ficha-detalles">
                {producto.detalles.map((detalle) => (
                  <li key={detalle}>{detalle}</li>
                ))}
              </ul>
            </div>

            <Acordeon>
              {politicas.map((politica) => (
                <ItemAcordeon key={politica.titulo} titulo={politica.titulo}>
                  {politica.texto}
                </ItemAcordeon>
              ))}
            </Acordeon>
          </div>
        </section>

        {relacionados.length > 0 && (
          <section className="completa">
            <Reveal>
              <h2 className="title completa-titulo">Completa el look</h2>
            </Reveal>
            <GridProducto productos={relacionados} className="grid-cuatro" />
          </section>
        )}

        <BarraCompra />
        <PanelConfirmacion />
      </VarianteProvider>
    </article>
  )
}
