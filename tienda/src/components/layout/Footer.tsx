import Link from 'next/link'
import { LogoNude, MarcaNude } from '@/components/brand/Logo'
import { TrazoCierre } from '@/components/motion/Trazo'
import { Envelope, InstagramLogo, WhatsappLogo } from '@/components/ui/icons'
import { navPie, prefetchable, site } from '@/lib/site'

/**
 * SPEC §4.1 bloque 9 — Footer: fondo Umber, logo en negativo, 3 columnas de
 * links, Instagram + WhatsApp, copyright.
 *
 * El trazo continuo (§11.1) cierra aqui: baja bajo el isotipo y termina en el
 * punto, el mismo gesto con el que esta construido el logo.
 */
export function Footer() {
  const ano = 2026 // se actualiza a mano: Date en render rompe el cache estatico

  return (
    <footer className="on-dark footer">
      <div className="container-nude">
        <div className="footer-trazo">
          <MarcaNude alto={40} className="text-dune" />
          <TrazoCierre />
        </div>

        <div className="footer-grid">
          <div className="footer-marca">
            <LogoNude alto={30} title={site.nombre} className="text-cream" />
            <p className="quote footer-tagline">{site.tagline}</p>
            <ul className="footer-social">
              <li>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="icon-btn"
                  aria-label={`Instagram, @${site.instagram}`}
                >
                  <InstagramLogo size={20} weight="light" />
                </a>
              </li>
              <li>
                <a
                  href={site.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="icon-btn"
                  aria-label="Escribinos por WhatsApp"
                >
                  <WhatsappLogo size={20} weight="light" />
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="icon-btn"
                  aria-label={`Escribinos a ${site.email}`}
                >
                  <Envelope size={20} weight="light" />
                </a>
              </li>
            </ul>
          </div>

          {navPie.map((columna) => (
            <nav key={columna.titulo} className="footer-col" aria-label={columna.titulo}>
              <h2 className="label footer-col-titulo">{columna.titulo}</h2>
              <ul>
                {columna.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-nav"
                      prefetch={prefetchable(link.href) ? undefined : false}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="rule footer-rule" />

        <div className="footer-legal">
          <p>
            © {ano} {site.nombre}. Hecho en Colombia.
          </p>
          <p>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="link-nav">
              @{site.instagram}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
