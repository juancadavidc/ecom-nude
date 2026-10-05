'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GearSix, Receipt, SquaresFour, TShirt } from '@/components/ui/icons'

const SECCIONES = [
  { href: '/admin/productos', nombre: 'Productos', Icono: TShirt },
  { href: '/admin/categorias', nombre: 'Categorías', Icono: SquaresFour },
  { href: '/admin/pedidos', nombre: 'Pedidos', Icono: Receipt },
  { href: '/admin/configuracion', nombre: 'Configuración', Icono: GearSix },
] as const

/**
 * Las mismas cuatro secciones en dos formas: lateral en escritorio, barra de
 * pestañas abajo en el celular (al alcance del pulgar).
 */
export function NavAdmin({ forma }: { forma: 'lateral' | 'tabs' }) {
  const ruta = usePathname()
  const actual = (href: string) => ruta === href || ruta.startsWith(`${href}/`)

  if (forma === 'tabs') {
    return (
      <nav className="adm-tabs" aria-label="Secciones del panel">
        {SECCIONES.map(({ href, nombre, Icono }) => (
          <Link key={href} href={href} className="adm-tab" aria-current={actual(href) ? 'page' : undefined}>
            <Icono size={22} weight={actual(href) ? 'regular' : 'light'} aria-hidden />
            {nombre}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="adm-nav" aria-label="Secciones del panel">
      {SECCIONES.map(({ href, nombre, Icono }) => (
        <Link key={href} href={href} aria-current={actual(href) ? 'page' : undefined}>
          <Icono size={20} weight={actual(href) ? 'regular' : 'light'} aria-hidden />
          {nombre}
        </Link>
      ))}
    </nav>
  )
}
