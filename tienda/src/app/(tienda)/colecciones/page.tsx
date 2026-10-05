import type { Metadata } from 'next'
import { Catalogo } from '@/components/producto/Catalogo'
import { listarProductos } from '@/lib/productos'

export const dynamic = 'force-dynamic'

/**
 * Todo el catalogo en una pagina. Es el destino de "Ver todo" en los destacados
 * de la home y de la entrada "Colecciones" del menu, que hasta ahora caia en el
 * 404 (ver README, fase 1).
 *
 * TODO(decision-abierta-4): cuando la primera coleccion tenga nombre propio,
 * esto pasa a ser una portada editorial y el catalogo completo se queda debajo.
 */
const INTRO =
  'Toda la colección: enterizos, sets, leggings, tops y accesorios. Diseñada para moverte, hecha para quedarse.'

export const metadata: Metadata = {
  title: 'La colección',
  description: INTRO,
}

export default async function ColeccionesPage() {
  const { productos } = await listarProductos()
  return <Catalogo titulo="La colección" intro={INTRO} productos={productos} />
}
