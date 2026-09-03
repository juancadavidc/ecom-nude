import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { anuncioVigente } from '@/lib/anuncios'
import { cx } from '@/lib/format'

/**
 * Layout de la tienda: header fijo con navegacion + footer.
 *
 * El checkout va aparte, en su propio grupo de rutas: ahi el header pierde la
 * navegacion y queda solo el logo (SPEC §4.5) porque cada salida es una venta
 * perdida. Por eso Header y Footer no viven en el layout raiz.
 */
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenido" className="skip-link btn btn-primary">
        Ir al contenido
      </a>
      <Header />
      {/* El header es fijo: el hueco que reserva el contenido depende de si la
          franja de anuncio esta encendida (src/content/anuncios.json). */}
      <main id="contenido" className={cx('con-header', anuncioVigente && 'con-anuncio')}>
        {children}
      </main>
      <Footer />
    </>
  )
}
