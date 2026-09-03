import type { Metadata } from 'next'
import { Reveal } from '@/components/motion/Reveal'
import { TrazoColumna } from '@/components/motion/Trazo'
import { BotonLink } from '@/components/ui/Button'
import { manifiesto, pilares } from '@/lib/copy'
import { promesas, site } from '@/lib/site'

/**
 * FASE 1 — cascara de la home.
 *
 * Existe para ver el design system en contexto real (header fijo, eje izquierdo,
 * franja Umber centrada, el trazo, los reveals) y no para ser la home definitiva:
 * el hero fotografico, las tres tiles de categoria, los destacados y la captura
 * de correo son de la fase 6, cuando haya fotografia de producto.
 *
 * Los bloques que si estan usan copy ya aprobado — manifiesto de la tarjeta de
 * agradecimiento y los tres pilares de la landing. No se invento nada.
 */
export const metadata: Metadata = {
  title: 'Inicio',
}

export default function Home() {
  return (
    <>
      {/* Hero — SPEC §4.1 bloque 2. Sin foto todavia; el texto va en HTML sobre
          la imagen, nunca quemado dentro del JPG, asi que la estructura ya sirve. */}
      <section className="hero">
        <div className="container-nude hero-inner">
          <Reveal>
            <p className="label text-muted">Proximamente</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="display-xl hero-titulo">{site.tagline}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="body measure hero-texto">
              Leggings y tops en tonos tierra. Disenada para moverte. Hecha para quedarse.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <BotonLink href="/sistema" variante="secundario">
              Ver el sistema
            </BotonLink>
          </Reveal>
        </div>
        {/* El trazo entra por el header y baja: primer tramo del recorrido (§11.1) */}
        <div className="hero-trazo" aria-hidden="true">
          <TrazoColumna alto={120} esperarVista={false} />
        </div>
      </section>

      {/* Manifiesto — SPEC §4.1 bloque 3. Franja Umber, Cormorant italica,
          centrado y maximo 640px. Uno de los dos unicos momentos centrados del
          sitio (§11.2), y por eso pesa. */}
      <section className="on-dark section manifiesto">
        <div className="container-nude manifiesto-inner">
          <Reveal>
            <p className="label manifiesto-label">{manifiesto.label}</p>
          </Reveal>
          {manifiesto.parrafos.map((parrafo, i) => (
            <Reveal key={parrafo} delay={80 + i * 80}>
              <p className="quote manifiesto-texto">{parrafo}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Los tres pilares — SPEC §4.1 bloque 6. Eje izquierdo constante (§11.2). */}
      <section className="section">
        <div className="container-nude">
          <Reveal>
            <p className="label text-muted">La esencia</p>
            <h2 className="title pilares-titulo">Tres promesas</h2>
          </Reveal>
          <div className="pilares">
            {pilares.map((pilar, i) => (
              <Reveal key={pilar.nombre} delay={i * 80}>
                <article className="pilar">
                  <TrazoColumna alto={40} className="pilar-trazo" />
                  <h3 className="product-name">{pilar.nombre}</h3>
                  <p className="body-s text-muted">{pilar.texto}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Franja de confianza — SPEC §4.1 bloque 7 */}
      <section className="on-sahara promesas-franja">
        <div className="container-nude promesas">
          {promesas.map((promesa) => (
            <div key={promesa.titulo} className="promesa">
              <h3 className="card-name">{promesa.titulo}</h3>
              <p className="body-s text-muted">{promesa.detalle}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
