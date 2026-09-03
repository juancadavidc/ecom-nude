import type { Metadata } from 'next'
import { MarcaNude } from '@/components/brand/Logo'
import { BotonLink } from '@/components/ui/Button'
import { microcopy } from '@/lib/copy'

/**
 * SPEC §4.6 — 404: isotipo, "Esta pagina se movio.", boton al catalogo.
 * Vive en el layout raiz (no dentro de `(tienda)`) para que tambien cubra
 * rutas fuera de la tienda, como el checkout o el panel.
 */
export const metadata: Metadata = {
  title: 'Pagina no encontrada',
  robots: { index: false, follow: false },
}

export default function NoEncontrada() {
  return (
    <main className="no-encontrada">
      <MarcaNude alto={56} className="text-line" />
      <h1 className="quote">{microcopy.error404}</h1>
      <BotonLink href="/leggings" variante="secundario">
        Ver leggings
      </BotonLink>
    </main>
  )
}
