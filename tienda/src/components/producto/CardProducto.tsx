import Link from 'next/link'
import { FotoFondo } from '@/components/media/FotoFondo'
import { SinFoto } from '@/components/media/SinFoto'
import { ANCHOS_PRODUCTO } from '@/lib/fotos'
import { cx, formatCOP } from '@/lib/format'
import type { EstadoVisible, Producto } from '@/lib/producto-modelo'
import { coloresDe, estadoVisible, rangoPrecio } from '@/lib/producto-modelo'

/**
 * SPEC §4.2 — card de producto. Imagen 3:4, cruce a la segunda foto en 300ms,
 * nombre, precio y swatches.
 *
 * La card entera es el enlace, asi que los swatches son `<span>`, no botones:
 * un control dentro de otro control no es navegable por teclado y el lector de
 * pantalla lee dos cosas donde hay una.
 *
 * Sin inventario no hay "ultimas unidades": el badge solo dice agotado o
 * proximamente (SPEC §7). Nunca porcentajes, nunca rojo.
 *
 * La foto de la card es la del primer color que tenga fotos: un color nuevo sin
 * sesion todavia no deja la card en blanco.
 */

const BADGE: Record<EstadoVisible, { texto: string; solido: boolean } | null> = {
  activo: null,
  agotado: { texto: 'Agotado por ahora', solido: true },
  proximamente: { texto: 'Próximamente', solido: false },
}

export function CardProducto({ producto }: { producto: Producto }) {
  const colores = coloresDe(producto)
  const fotos = colores.map((c) => producto.imagenes[c.nombre]).find((f) => f?.length) ?? []
  const badge = BADGE[estadoVisible(producto)]
  const { min, max } = rangoPrecio(producto)

  return (
    <Link href={`/${producto.categoria}/${producto.slug}`} className="card">
      <div className="card-foto">
        {fotos[0] ? (
          <FotoFondo
            nombre={fotos[0]}
            anchos={[...ANCHOS_PRODUCTO]}
            ancho={960}
            alto={1280}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            alt={producto.seo.alt}
          />
        ) : (
          <SinFoto />
        )}
        {fotos[1] && (
          <FotoFondo
            nombre={fotos[1]}
            anchos={[...ANCHOS_PRODUCTO]}
            ancho={960}
            alto={1280}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
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
        <p className="price-sm">
          {min === max ? formatCOP(min) : `Desde ${formatCOP(min)}`}
        </p>
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
