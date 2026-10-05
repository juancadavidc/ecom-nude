import type { Metadata } from 'next'
import { BloqueContenido, PaginaContenido } from '@/components/contenido/PaginaContenido'
import { manifiesto, pilares } from '@/lib/copy'

export const metadata: Metadata = {
  title: 'Nosotras',
  description: 'Ropa deportiva femenina colombiana. Suavidad, movimiento y confianza silenciosa.',
}

/** Solo copy aprobado: manifiesto de la tarjeta de agradecimiento y los tres pilares. */
export default function NosotrosPage() {
  return (
    <PaginaContenido titulo="Nosotras" intro={manifiesto.parrafos[0]}>
      <BloqueContenido titulo="Lo que hacemos">
        <p>{manifiesto.parrafos[1]}</p>
      </BloqueContenido>
      {pilares.map((pilar) => (
        <BloqueContenido key={pilar.nombre} titulo={pilar.nombre}>
          <p>{pilar.texto}</p>
        </BloqueContenido>
      ))}
    </PaginaContenido>
  )
}
