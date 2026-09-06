import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Catalogo } from '@/components/producto/Catalogo'
import { CATEGORIAS, INTRO_CATEGORIA, NOMBRE_CATEGORIA, esCategoria } from '@/lib/producto-modelo'
import { listarProductos } from '@/lib/productos'

/**
 * Catalogo por categoria: /leggings, /tops, /sets.
 *
 * `dynamicParams = false` mas `generateStaticParams` es lo que hace posible la
 * ruta dinamica con `output: 'export'`: se prerenderizan exactamente tres
 * paginas y cualquier otro segmento cae en el 404, en vez de intentar
 * renderizarse en un servidor que no existe.
 *
 * Los segmentos estaticos hermanos (/sistema, /colecciones) ganan sobre este:
 * Next resuelve primero la ruta literal.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria }))
}

type Props = { params: Promise<{ categoria: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params
  if (!esCategoria(categoria)) return {}
  return {
    title: NOMBRE_CATEGORIA[categoria],
    description: INTRO_CATEGORIA[categoria],
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params
  if (!esCategoria(categoria)) notFound()

  const { productos } = await listarProductos({ categoria })

  return (
    <Catalogo
      titulo={NOMBRE_CATEGORIA[categoria]}
      intro={INTRO_CATEGORIA[categoria]}
      productos={productos}
    />
  )
}
