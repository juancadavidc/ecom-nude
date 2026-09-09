import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Catalogo } from '@/components/producto/Catalogo'
import { INTRO_CATEGORIA, NOMBRE_CATEGORIA, esCategoria } from '@/lib/producto-modelo'
import { listarProductos } from '@/lib/productos'

/**
 * Catalogo por categoria: /leggings, /tops, /sets. Se renderiza en servidor en
 * cada peticion porque lee de Postgres — no hay `generateStaticParams` que
 * prerenderice esto en build, ya que el build del contenedor (Dockerfile) no
 * tiene la base disponible.
 */
export const dynamic = 'force-dynamic'

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
