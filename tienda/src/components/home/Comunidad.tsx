import { FotoFondo } from '@/components/media/FotoFondo'
import { InstagramLogo } from '@/components/ui/icons'
import { site } from '@/lib/site'

/**
 * SPEC de diseno §3 bloque 8 — "Como la llevan". Es el aporte estructural de la
 * referencia: prueba social sin inventar resenas.
 *
 * No hay resenas en la v1 (SPEC §4.3): sin ventas serian inventadas, y las
 * inventadas se notan. Seis fotos y la cuenta de Instagram dicen lo mismo sin
 * mentir.
 *
 * TODO(decision-abierta-5): las seis son recortes de la unica sesion que existe.
 * Cuando haya contenido real de clientas, esto se llena de eso.
 */
const FOTOS = [
  { nombre: 'comunidad-1', ancho: 441, alto: 588 },
  { nombre: 'comunidad-2', ancho: 441, alto: 588 },
  { nombre: 'comunidad-3', ancho: 441, alto: 588 },
  { nombre: 'comunidad-4', ancho: 360, alto: 480 },
  { nombre: 'comunidad-5', ancho: 360, alto: 480 },
  { nombre: 'comunidad-6', ancho: 360, alto: 480 },
]

export function Comunidad() {
  return (
    <section className="comunidad" aria-labelledby="comunidad-titulo">
      <div className="container-nude comunidad-head eje">
        <div>
          <p className="label text-muted">Como la llevan</p>
          <h2 className="title" id="comunidad-titulo">
            En movimiento
          </h2>
        </div>
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="link body-s eje-fin"
        >
          <InstagramLogo size={16} weight="light" aria-hidden="true" /> @{site.instagram}
        </a>
      </div>

      <ul className="comunidad-grid">
        {FOTOS.map((foto) => (
          <li key={foto.nombre} className="comunidad-foto">
            <FotoFondo
              nombre={foto.nombre}
              anchos={[foto.ancho]}
              ancho={foto.ancho}
              alto={foto.alto}
              sizes="(min-width: 768px) 33vw, 50vw"
              alt="Clienta de NUDE con conjunto de top y legging en tonos tierra"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
