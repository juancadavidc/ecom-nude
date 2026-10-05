import type { Metadata } from 'next'
import { FilaCategoria } from '@/components/admin/categorias/FilaCategoria'
import { NuevaCategoria } from '@/components/admin/categorias/NuevaCategoria'
import { listarCategoriasPanel } from '@/lib/admin/datos'

export const metadata: Metadata = { title: 'Categorías' }

export default async function CategoriasPage() {
  const categorias = await listarCategoriasPanel()
  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <h1>Categorías</h1>
          <p className="adm-muted adm-s">
            El orden de esta lista es el del menú de la tienda. Una categoría sin productos publicados no aparece.
          </p>
        </div>
      </div>

      <ol className="adm-lista">
        {categorias.map((c, i) => (
          <FilaCategoria key={c.slug} c={c} primera={i === 0} ultima={i === categorias.length - 1} />
        ))}
      </ol>

      <section className="adm-seccion adm-seccion-aparte" aria-labelledby="sec-nueva">
        <div className="adm-seccion-cabeza">
          <h2 id="sec-nueva">Nueva categoría</h2>
          <p className="adm-s adm-muted">Queda al final del menú. La subes con las flechas.</p>
        </div>
        <NuevaCategoria />
      </section>
    </>
  )
}
