import type { Metadata } from 'next'
import { BloqueContenido, PaginaContenido } from '@/components/contenido/PaginaContenido'

export const metadata: Metadata = {
  title: 'Cambios y devoluciones',
  description: 'Tienes 15 días desde que recibes para cambiar la talla o el color.',
}

export default function CambiosPage() {
  return (
    <PaginaContenido
      titulo="Cambios y devoluciones"
      intro="Si no es tu talla, la cambiamos."
    >
      <BloqueContenido titulo="Cómo funciona">
        <p>
          Tienes 15 días desde que recibes para cambiar la talla o el color. La prenda tiene que
          volver sin usar y con su etiqueta. Escríbenos por WhatsApp con tu número de pedido y
          coordinamos la recogida.
        </p>
      </BloqueContenido>
      <BloqueContenido titulo="Cómo cuidar tu prenda">
        <p>
          Lava a mano en agua fría y con jabón suave. Sin blanqueador y sin secadora. Seca a la
          sombra y extendida: el sol abre el elastano y la prenda pierde la forma.
        </p>
      </BloqueContenido>
    </PaginaContenido>
  )
}
