import Link from 'next/link'
import { FotoFondo } from '@/components/media/FotoFondo'
import { ANCHOS_PRODUCTO } from '@/lib/fotos'
import type { Categoria } from '@/lib/producto-modelo'

/**
 * SPEC §4.1 bloque 4 — tile a sangre con el nombre encima de la foto.
 *
 * El nombre va en HTML sobre la imagen, nunca quemado en el JPG: se traduce, se
 * indexa, lo lee un lector de pantalla y no obliga a rehacer el arte cuando
 * cambia el copy.
 *
 * La foto es una de producto (scripts/gen-catalogo.mjs): 3:4 en 480 y 960.
 */
export function TileCategoria({
  categoria,
  nombre,
  foto,
  alt,
}: {
  categoria: Categoria
  nombre: string
  foto: string
  alt: string
}) {
  return (
    <Link href={`/${categoria}`} className="tile on-dark">
      <FotoFondo
        nombre={foto}
        anchos={[...ANCHOS_PRODUCTO]}
        ancho={960}
        alto={1280}
        sizes="(min-width: 768px) 33vw, 100vw"
        alt={alt}
      />
      <div className="tile-velo" aria-hidden="true" />
      <h3 className="title tile-nombre">{nombre}</h3>
    </Link>
  )
}
