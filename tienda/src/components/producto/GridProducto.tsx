import { cx } from '@/lib/format'
import type { Producto } from '@/lib/producto-modelo'
import { CardProducto } from './CardProducto'

/**
 * La grilla, y nada mas. No tiene estado ni `'use client'` a proposito: es la
 * que renderiza el servidor, la que ve Google y la que queda en pantalla cuando
 * no hay JavaScript (SPEC §9.5, §12).
 *
 * El filtrado y el "Cargar mas" viven en `GridFiltrado`, que la reutiliza.
 * `className` es opcional: "Completa el look" y los destacados de la home la
 * usan para pasar `.grid-cuatro` sin duplicar el componente.
 */
export function GridProducto({
  productos,
  className,
}: {
  productos: Producto[]
  className?: string
}) {
  return (
    <ul className={cx('grid-producto', className)}>
      {productos.map((producto) => (
        <li key={producto.slug}>
          <CardProducto producto={producto} />
        </li>
      ))}
    </ul>
  )
}
