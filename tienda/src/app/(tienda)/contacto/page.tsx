import type { Metadata } from 'next'
import { BloqueContenido, PaginaContenido } from '@/components/contenido/PaginaContenido'
import { Envelope, InstagramLogo, WhatsappLogo } from '@/components/ui/icons'
import { leerClave } from '@/lib/config'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbenos por WhatsApp, Instagram o correo.',
}

export default async function ContactoPage() {
  const whatsapp = await leerClave('whatsapp')

  return (
    <PaginaContenido
      titulo="Contacto"
      intro="Te respondemos por WhatsApp, que es donde coordinamos tallas, pagos y entregas."
    >
      <BloqueContenido titulo="Escríbenos">
        <ul className="contenido-contacto">
          <li>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="link">
              <WhatsappLogo size={20} weight="light" aria-hidden="true" />
              WhatsApp
            </a>
          </li>
          <li>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="link">
              <InstagramLogo size={20} weight="light" aria-hidden="true" />@{site.instagram}
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`} className="link">
              <Envelope size={20} weight="light" aria-hidden="true" />
              {site.email}
            </a>
          </li>
        </ul>
      </BloqueContenido>
    </PaginaContenido>
  )
}
