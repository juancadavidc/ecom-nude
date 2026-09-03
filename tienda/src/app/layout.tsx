import type { Metadata, Viewport } from 'next'
import { fontClassNames } from '@/lib/fonts'
import { site } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nombre} — ${site.tagline}`,
    template: `%s · ${site.nombre}`,
  },
  description: site.descripcion,
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: site.nombre,
    title: `${site.nombre} — ${site.tagline}`,
    description: site.descripcion,
  },
  robots: {
    // TODO(pre-lanzamiento): pasar a index cuando el catalogo este publicado
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#F6EBDE',
  colorScheme: 'light',
}

/**
 * SPEC §9.5 — la trampa de las animaciones de entrada.
 * Si el contenido arranca en `opacity: 0` y se revela con JavaScript, el
 * rastreador de Google puede indexar una pagina vacia.
 *
 * El SPEC propone resolverlo con una clase en <html> puesta por un script.
 * No hace falta: `@media (scripting: enabled)` es la misma condicion evaluada
 * por CSS. Todas las reglas que esconden algo en globals.css cuelgan de ahi,
 * asi que sin JavaScript no hay estado oculto y se ve el contenido completo.
 * Un script menos, y nada que hidratar mal.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={fontClassNames}>
      <body>{children}</body>
    </html>
  )
}
