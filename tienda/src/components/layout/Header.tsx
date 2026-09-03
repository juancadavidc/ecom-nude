import Link from 'next/link'
import { LogoNude } from '@/components/brand/Logo'
import { navPrincipal, site } from '@/lib/site'
import { BotonCarrito } from './BotonCarrito'
import { NavMovil } from './NavMovil'

/**
 * SPEC §4.1 bloque 1 — Header fijo.
 * Desktop: logo (Principal 2, sin isotipo) a la izquierda, nav centrada,
 * carrito a la derecha. Fondo Cream, linea Ochre 25% abajo.
 * Movil: logo centrado, hamburguesa a la izquierda, carrito a la derecha.
 *
 * Es Server Component: los unicos trozos con estado son la hamburguesa y el
 * carrito, y viven en sus propias islas cliente.
 *
 * `variante="checkout"` quita la navegacion y deja solo el logo (SPEC §4.5):
 * cada salida del checkout es una venta perdida.
 */
export function Header({ variante = 'tienda' }: { variante?: 'tienda' | 'checkout' }) {
  if (variante === 'checkout') {
    return (
      <header className="header header-checkout">
        <div className="container-nude header-inner header-inner-checkout">
          <Link href="/" className="header-logo" aria-label={`${site.nombre}, ir al inicio`}>
            <LogoNude alto={22} />
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="header">
      <div className="container-nude header-inner">
        <div className="header-izq">
          <NavMovil items={navPrincipal} />
        </div>

        <Link href="/" className="header-logo" aria-label={`${site.nombre}, ir al inicio`}>
          <LogoNude alto={22} />
        </Link>

        <nav className="header-nav" aria-label="Navegacion principal">
          <ul>
            {navPrincipal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-nav">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-der">
          {/* TODO(fase-3): buscador, cuando exista catalogo que buscar */}
          <BotonCarrito />
        </div>
      </div>
    </header>
  )
}
