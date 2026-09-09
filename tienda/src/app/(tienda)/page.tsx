import type { Metadata } from 'next'
import { Comunidad } from '@/components/home/Comunidad'
import { Newsletter } from '@/components/home/Newsletter'
import { TileCategoria } from '@/components/home/TileCategoria'
import { FotoFondo } from '@/components/media/FotoFondo'
import { Reveal } from '@/components/motion/Reveal'
import { TrazoColumna } from '@/components/motion/Trazo'
import { GridProducto } from '@/components/producto/GridProducto'
import { BotonLink } from '@/components/ui/Button'
import { ArrowsClockwise, Truck, Wallet } from '@/components/ui/icons'
import { manifiesto, microcopy, pilares } from '@/lib/copy'
import { destacados } from '@/lib/productos'
import { promesas, site } from '@/lib/site'

export const dynamic = 'force-dynamic'

/* `site.ts` nombra el icono; la pagina lo resuelve. Asi la configuracion no
   arrastra componentes de React. */
const ICONO_PROMESA = {
  envio: Truck,
  pago: Wallet,
  cambio: ArrowsClockwise,
} as const

/**
 * Home. Las categorias y los destacados llevan al catalogo (tarea 10). El
 * formulario de correo (`Newsletter`) ya esta montado, pero todavia no guarda
 * nada — ver el TODO(fase-6) en ese componente.
 *
 * Los bloques que ya estaban usan copy aprobado — manifiesto de la tarjeta de
 * agradecimiento y los tres pilares de la landing. No se invento nada.
 */
export const metadata: Metadata = {
  title: 'Inicio',
}

export default async function Home() {
  const productosDestacados = await destacados(4)
  return (
    <>
      {/* Hero — SPEC §4.1 bloque 2. La foto va a sangre y el texto encima en
          HTML, nunca quemado dentro del JPG: asi se traduce, se indexa, lo lee
          un lector de pantalla y no se pixela en pantallas grandes. Es lo unico
          que separa este hero del carrusel de la referencia (assets/reference).

          Sobre la foto el texto invierte: Cream sobre el velo. El secundario y
          el trazo cambian de tono en `.hero` via token, no clase por clase. */}
      <section className="hero on-dark">
        <FotoFondo
          nombre="home-hero"
          anchos={[768, 1024, 1366]}
          ancho={1366}
          alto={768}
          prioridad
          alt="Tres vistas de la modelo con el conjunto NUDE: top corto y leggings negros con paneles de malla."
          className="hero-foto"
        />
        {/* Velo: es lo que hace legible el texto sobre la pared clara del
            estudio. Va en su propia capa, no como filtro de la foto, porque
            cambia de direccion entre movil y escritorio (ver globals.css). */}
        <div className="hero-velo" aria-hidden="true" />
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
            <BotonLink href="/colecciones" variante="outline-invert">
              Ver la coleccion
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

      {/* Categorias — SPEC §4.1 bloque 4. A sangre: la foto toca el borde de la
          pantalla. Es el contraste con el margen amplio del texto lo que hace que
          esto lea como editorial y no como plantilla centrada.

          Los tres anchos no son iguales: el crop de leggings se rehizo en la
          tarea 3 a 280x373 porque a 588 de alto ningun offset libraba la
          barbilla de la modelo. `TileCategoria` recibe ancho/alto por tile en
          vez de asumir 441x588 para no reservar la caja equivocada ni pedir un
          archivo que no existe. */}
      <section className="tiles" aria-label="Categorias">
        <TileCategoria
          categoria="leggings"
          foto="categoria-leggings"
          alt="Detalle de la cinturilla alta de un legging NUDE, de perfil"
          ancho={280}
          alto={373}
        />
        <TileCategoria
          categoria="tops"
          foto="categoria-tops"
          alt="Top corto NUDE con panel de malla, vista frontal"
          ancho={441}
          alto={588}
        />
        <TileCategoria
          categoria="sets"
          foto="categoria-sets"
          alt="Conjunto NUDE de top y legging, cuerpo entero"
          ancho={441}
          alto={588}
        />
      </section>

      {/* Destacados — SPEC §4.1 bloque 5. Grilla, no carrusel: el carrusel
          esconde producto detras de una flecha. */}
      <section className="section">
        <div className="container-nude">
          <div className="eje destacados-head">
            <Reveal>
              <p className="label text-muted">Lo nuevo</p>
              <h2 className="title">Primera Piel</h2>
            </Reveal>
            <Reveal className="eje-fin" delay={80}>
              <BotonLink href="/colecciones" variante="secundario">
                {microcopy.verTodo}
              </BotonLink>
            </Reveal>
          </div>
          <GridProducto productos={productosDestacados} className="grid-cuatro" />
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

      {/* Franja de confianza — SPEC §4.1 bloque 7. El tratamiento con icono
          viene de la referencia; el contenido, del SPEC. */}
      <section className="on-sahara franja-confianza">
        <div className="container-nude franja-iconos">
          {promesas.map((promesa) => {
            const Icono = ICONO_PROMESA[promesa.icono]
            return (
              <div key={promesa.titulo} className="franja-icono">
                <Icono size={24} weight="light" aria-hidden="true" />
                <h3 className="card-name">{promesa.titulo}</h3>
                <p className="body-s text-muted">{promesa.detalle}</p>
              </div>
            )
          })}
        </div>
      </section>

      <Comunidad />

      <Newsletter />
    </>
  )
}
