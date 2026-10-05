import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Catalogo } from '@/components/producto/Catalogo'
import { listarProductos, obtenerCategoria } from '@/lib/productos'

/**
 * Catalogo por categoria: /enterizos, /leggings, /sets... Las categorias viven
 * en Postgres (tabla `categorias`), asi que una nueva aparece aqui sin tocar
 * codigo. Se renderiza en servidor en
 * cada peticion porque lee de Postgres — no hay `generateStaticParams` que
 * prerenderice esto en build, ya que el build del contenedor (Dockerfile) no
 * tiene la base disponible.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ categoria: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params
  const info = await obtenerCategoria(categoria)
  if (!info) return {}
  return { title: info.nombre, description: info.intro }
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params
  const info = await obtenerCategoria(categoria)
  if (!info || !info.visible) notFound()

  const { productos } = await listarProductos({ categoria })

  return <Catalogo titulo={info.nombre} intro={info.intro} productos={productos} />
}
