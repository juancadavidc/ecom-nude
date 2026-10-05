import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { WhatsappLogo } from '@/components/ui/icons'
import { leerClave } from '@/lib/config'
import './checkout.css'

/**
 * Checkout y confirmacion (SPEC §4.5): el header pierde la navegacion y queda
 * solo el logo. Cada salida es una venta perdida, asi que el pie tampoco
 * enlaza al resto de la tienda — solo a WhatsApp, en otra pestaña, para quien
 * tenga una duda antes de confirmar.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const whatsapp = await leerClave('whatsapp')
  return (
    <>
      <a href="#contenido" className="skip-link btn btn-primary">
        Ir al contenido
      </a>
      <Header variante="checkout" />
      <main id="contenido" className="con-header co-main">
        {children}
      </main>
      <footer className="co-pie">
        <div className="container-nude">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="co-pie-link"
          >
            <WhatsappLogo size={20} weight="light" />
            <span>¿Tienes una duda? Escríbenos por WhatsApp</span>
          </a>
        </div>
      </footer>
    </>
  )
}
