import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

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
      <main id="contenido" className="con-header">
        {children}
      </main>
      <Footer />
    </>
  )
}
