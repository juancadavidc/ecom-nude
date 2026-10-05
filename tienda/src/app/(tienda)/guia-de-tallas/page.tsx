import type { Metadata } from 'next'
import { BloqueContenido, PaginaContenido } from '@/components/contenido/PaginaContenido'
import { TablaTallas } from '@/components/producto/TablaTallas'

export const metadata: Metadata = {
  title: 'Guía de tallas',
  description: 'Medidas del cuerpo en centímetros para elegir tu talla.',
}

/** Las medidas son provisionales: ver TODO(decision-abierta-1) en src/lib/tallas.ts. */
export default function GuiaTallasPage() {
  return (
    <PaginaContenido
      titulo="Guía de tallas"
      intro="Medidas del cuerpo en centímetros. Si estás entre dos tallas, elige la mayor: la tela cede."
    >
      <BloqueContenido titulo="Medidas">
        <TablaTallas />
        <p className="body-s text-muted">
          Mide sobre la piel, sin apretar la cinta. Las calentadoras, medias y manguitas son talla
          única. Si dudas, escríbenos por WhatsApp con tus medidas y te ayudamos a elegir.
        </p>
      </BloqueContenido>
    </PaginaContenido>
  )
}
