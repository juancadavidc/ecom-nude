import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'

/**
 * Plantilla de las paginas de contenido (SPEC §4.6): titulo sobre el eje
 * izquierdo (§11.2) y el cuerpo a medida de lectura. Sin hero, sin tarjetas:
 * aqui se viene a leer una respuesta y volver a comprar.
 */
export function PaginaContenido({
  titulo,
  intro,
  children,
}: {
  titulo: string
  intro?: string
  children: ReactNode
}) {
  return (
    <article className="container-nude contenido">
      <header className="eje contenido-head">
        <Reveal>
          <h1 className="display-l">{titulo}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={80}>
            <p className="body measure text-muted">{intro}</p>
          </Reveal>
        )}
      </header>
      <div className="eje contenido-cuerpo">{children}</div>
    </article>
  )
}

export function BloqueContenido({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="contenido-bloque">
      <h2 className="title">{titulo}</h2>
      <div className="body measure contenido-texto">{children}</div>
    </section>
  )
}
