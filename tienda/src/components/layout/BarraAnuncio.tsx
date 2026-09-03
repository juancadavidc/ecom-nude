import Link from 'next/link'
import { anuncioVigente, tonoAnuncio } from '@/lib/anuncios'

/**
 * Franja sobre el header con la promesa vigente (envio gratis, cambios, etc.).
 * La data sale de `src/content/anuncios.json`; aqui solo se pinta.
 *
 * El texto va en caja alta con tracking desde CSS: ese tratamiento era el de la
 * nav, que ahora pasa a peso normal. Asi el header sigue teniendo un solo
 * elemento en versalitas y no compiten dos.
 *
 * Server Component: sin estado, sin JavaScript en el cliente.
 */
export function BarraAnuncio() {
  if (!anuncioVigente) return null

  const { texto, href } = anuncioVigente

  return (
    <div className="anuncio" data-tono={tonoAnuncio}>
      <div className="container-nude">
        {href ? (
          <Link href={href} className="anuncio-texto anuncio-link">
            {texto}
          </Link>
        ) : (
          <p className="anuncio-texto">{texto}</p>
        )}
      </div>
    </div>
  )
}
