import Link from 'next/link'
import { FotoFondo } from '@/components/media/FotoFondo'
import { cx, formatCOP } from '@/lib/format'
import type { EstadoVisible, Producto } from '@/lib/producto-modelo'
import { coloresDe, estadoVisible } from '@/lib/producto-modelo'

/**
 * SPEC §4.2 — card de producto. Imagen 3:4, cruce a la segunda foto en 300ms,
 * nombre, precio y swatches.
 *
 * La card entera es el enlace, asi que los swatches son `<span>`, no botones:
 * un control dentro de otro control no es navegable por teclado y el lector de
 * pantalla lee dos cosas donde hay una.
 *
 * El badge sale del stock, no de un campo del archivo: "ultimas unidades" tiene
 * que ser cierto (SPEC §7). Nunca porcentajes, nunca rojo.
 */

const BADGE: Record<EstadoVisible, { texto: string; solido: boolean } | null> = {
  activo: null,
  ultimas: { texto: 'Ultimas unidades', solido: false },
  agotado: { texto: 'Agotado', solido: true },
  proximamente: { texto: 'Proximamente', solido: false },
}

export function CardProducto({ producto }: { producto: Producto }) {
  const colores = coloresDe(producto)
  const fotos = producto.imagenes[colores[0].nombre] ?? []
  const badge = BADGE[estadoVisible(producto)]

  return (
    <Link href={`/${producto.categoria}/${producto.slug}`} className="card">
      <div className="card-foto">
        <FotoFondo
          nombre={fotos[0]}
          anchos={[900]}
          ancho={900}
          alto={1200}
          sizes="(min-width: 768px) 33vw, 50vw"
          alt={producto.seo.alt}
        />
        {fotos[1] && (
          <FotoFondo
            nombre={fotos[1]}
            anchos={[900]}
            ancho={900}
            alto={1200}
            sizes="(min-width: 768px) 33vw, 50vw"
            // Es la misma prenda en otra toma: describirla otra vez solo repite
            // el mismo texto en el lector de pantalla.
            alt=""
            className="card-foto-2"
          />
        )}
        {badge && (
          <span className={cx('badge card-badge', badge.solido && 'badge-solid')}>
            {badge.texto}
          </span>
        )}
      </div>

      <div className="card-info">
        <h3 className="card-name">{producto.nombre}</h3>
        <p className="price-sm">{formatCOP(producto.precio)}</p>
        <ul className="card-swatches" aria-label={`Colores: ${colores.map((c) => c.nombre).join(', ')}`}>
          {colores.map((color) => (
            <li key={color.nombre}>
              <span className="card-swatch" style={{ backgroundColor: color.hex }} />
            </li>
          ))}
        </ul>
      </div>
    </Link>
  )
}
