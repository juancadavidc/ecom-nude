import Link from 'next/link'
import { LogoNude } from '@/components/brand/Logo'
import { User } from '@/components/ui/icons'
import { navPrincipal, prefetchable, site } from '@/lib/site'
import { BarraAnuncio } from './BarraAnuncio'
import { BotonCarrito } from './BotonCarrito'
import { BotonBuscar, BuscadorProvider } from './Buscador'
import { NavMovil } from './NavMovil'

/**
 * SPEC §4.1 bloque 1 — Header fijo, con la estructura de dos pisos de la
 * referencia: franja de anuncio arriba y la barra de navegacion debajo.
 *
 * Desktop: logo a la izquierda, nav centrada, buscador + cuenta + carrito a la
 * derecha. Movil: hamburguesa + buscador a la izquierda, logo centrado, cuenta
 * + carrito a la derecha. Fondo Cream, linea Ochre 25% abajo.
 *
 * Es Server Component: los unicos trozos con estado (hamburguesa, buscador,
 * carrito) viven en sus propias islas cliente.
 *
 * `variante="checkout"` quita anuncio y navegacion y deja solo el logo
 * (SPEC §4.5): cada salida del checkout es una venta perdida.
 */
export function Header({ variante = 'tienda' }: { variante?: 'tienda' | 'checkout' }) {
  if (variante === 'checkout') {
    return (
      <header className="header header-checkout">
        <div className="container-nude header-inner header-inner-checkout">
          <Link href="/" className="header-logo" aria-label={`${site.nombre}, ir al inicio`}>
            <LogoNude alto={48} />
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="header">
      <BarraAnuncio />

      {/* El proveedor envuelve la barra entera, no la celda del icono: el
          buscador se dispara desde dos botones distintos segun el breakpoint y
          el panel tiene que ser uno solo. */}
      <BuscadorProvider>
        <div className="container-nude header-inner">
          <div className="header-izq">
            <NavMovil items={navPrincipal} />
            <BotonBuscar className="md:hidden" />
          </div>

          <Link href="/" className="header-logo" aria-label={`${site.nombre}, ir al inicio`}>
            <LogoNude alto={48} />
          </Link>

          <nav className="header-nav" aria-label="Navegacion principal">
            <ul>
              {navPrincipal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-nav"
                    prefetch={prefetchable(item.href) ? undefined : false}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-der">
            <BotonBuscar className="hidden md:inline-flex" />
            {/* TODO(fase-5): /cuenta llega con autenticacion. Hoy el icono ya
                ocupa su sitio para que el header no se reordene despues. */}
            <Link href="/cuenta" className="icon-btn" aria-label="Tu cuenta" prefetch={false}>
              <User size={22} weight="light" />
            </Link>
            <BotonCarrito />
          </div>
        </div>
      </BuscadorProvider>
    </header>
  )
}
