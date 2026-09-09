import Link from 'next/link'
import { CaretRight } from '@/components/ui/icons'
import type { Categoria } from '@/lib/producto-modelo'
import { NOMBRE_CATEGORIA } from '@/lib/producto-modelo'

/**
 * Aporte de la referencia: es SEO y es la salida de quien cae aqui desde Google
 * sin haber pasado por la home.
 *
 * Va sobre las dos columnas y no dentro de la de compra: en movil las columnas se
 * apilan y la miga acabaria despues de la galeria, que es justo donde ya no
 * sirve para orientarse.
 */
export function MigaDePan({ categoria, nombre }: { categoria: Categoria; nombre: string }) {
  return (
    <nav aria-label="Miga de pan">
      <ol className="miga body-s text-muted">
        <li>
          <Link href="/" className="link-nav">
            Inicio
          </Link>
          <CaretRight size={12} weight="light" aria-hidden="true" />
        </li>
        <li>
          <Link href={`/${categoria}`} className="link-nav">
            {NOMBRE_CATEGORIA[categoria]}
          </Link>
          <CaretRight size={12} weight="light" aria-hidden="true" />
        </li>
        <li aria-current="page">{nombre}</li>
      </ol>
    </nav>
  )
}
