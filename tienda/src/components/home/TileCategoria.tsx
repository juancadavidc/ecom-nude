import Link from 'next/link'
import { FotoFondo } from '@/components/media/FotoFondo'
import type { Categoria } from '@/lib/producto-modelo'
import { NOMBRE_CATEGORIA } from '@/lib/producto-modelo'

/**
 * SPEC §4.1 bloque 4 — tile a sangre con el nombre encima de la foto.
 *
 * El nombre va en HTML sobre la imagen, nunca quemado en el JPG: se traduce, se
 * indexa, lo lee un lector de pantalla y no obliga a rehacer el arte cuando
 * cambia el copy.
 *
 * `ancho`/`alto` son props, no una constante 441x588: el crop de leggings tuvo
 * que rehacerse a 280x373 (tarea 3, no hay offset vertical que libre la
 * barbilla de la modelo a 588 de alto) y las tres fotos ya no comparten
 * dimension. El tile sigue mostrando 3:4 via `.tile` + `object-fit: cover`.
 */
export function TileCategoria({
  categoria,
  foto,
  alt,
  ancho,
  alto,
}: {
  categoria: Categoria
  foto: string
  alt: string
  ancho: number
  alto: number
}) {
  return (
    <Link href={`/${categoria}`} className="tile on-dark">
      <FotoFondo
        nombre={foto}
        anchos={[ancho]}
        ancho={ancho}
        alto={alto}
        sizes="(min-width: 768px) 33vw, 100vw"
        alt={alt}
      />
      <div className="tile-velo" aria-hidden="true" />
      <h3 className="title tile-nombre">{NOMBRE_CATEGORIA[categoria]}</h3>
    </Link>
  )
}
