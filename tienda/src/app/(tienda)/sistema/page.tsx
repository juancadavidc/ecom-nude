import type { Metadata } from 'next'
import { LogoNude, LogoPrincipal, MarcaNude } from '@/components/brand/Logo'
import { TrazoCierre, TrazoColumna, TrazoPaso } from '@/components/motion/Trazo'
import { Acordeon, ItemAcordeon } from '@/components/ui/Acordeon'
import { Boton, BotonLink } from '@/components/ui/Button'
import { Truck, Wallet, ArrowsClockwise, Ruler, ImageSquare } from '@/components/ui/icons'
import { GridProducto } from '@/components/producto/GridProducto'
import { formatCOP } from '@/lib/format'
import { destacados } from '@/lib/productos'
import { DemoFormulario, DemoSelectores } from './Demos'

/**
 * Pagina de verificacion del design system. Es la herramienta de trabajo de la
 * fase 1: todo token y todo componente en un solo scroll, para revisar contraste,
 * area tactil, foco por teclado y comportamiento en movil antes de construir
 * catalogo y ficha encima.
 *
 * No se indexa (noindex) ni aparece en la navegacion.
 */
export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
}

const PALETA = [
  { token: '--cream', hex: '#F6EBDE', uso: 'Fondo principal de todo el sitio' },
  { token: '--white', hex: '#FDFAF6', uso: 'Tarjetas, inputs, superficies elevadas' },
  { token: '--sahara', hex: '#EDD5B8', uso: 'Secciones alternas, placeholder de imagen' },
  { token: '--dune', hex: '#DEB68E', uso: 'Texto secundario sobre Umber' },
  { token: '--ochre', hex: '#C4956A', uso: 'Bordes, lineas, iconos, hover, foco' },
  { token: '--umber', hex: '#5C3D28', uso: 'Todo el texto. Botones primarios, footer' },
]

const CONTRASTES = [
  { par: 'Umber sobre Cream', ratio: '8.29:1', pasa: true },
  { par: 'Umber sobre White', ratio: '9.37:1', pasa: true },
  { par: 'Umber sobre Sahara', ratio: '6.88:1', pasa: true },
  { par: 'Cream sobre Umber', ratio: '8.29:1', pasa: true },
  { par: 'Dune sobre Umber', ratio: '5.20:1', pasa: true },
  { par: 'text-muted sobre Cream', ratio: '4.93:1', pasa: true },
  { par: 'text-muted sobre Sahara', ratio: '4.10:1', pasa: false },
  { par: 'Ochre sobre Cream', ratio: '2.27:1', pasa: false },
  { par: 'Ochre sobre White', ratio: '2.57:1', pasa: false },
]

export default async function SistemaPage() {
  const muestraProductos = await destacados(3)
  return (
    <div className="sistema">
      <header className="container-nude sistema-hero">
        <p className="label text-muted">Fase 1</p>
        <h1 className="display-l">Design system</h1>
        <p className="body measure text-muted">
          Tokens, tipografia, botones, formularios, header y footer. Todo sale de SPEC §2, §5 y §11.
          Esta pagina existe para verificar; no se indexa ni se enlaza desde la tienda.
        </p>
      </header>

      {/* ---------------- Color ---------------- */}
      <Bloque numero="01" titulo="Color — Desert Dune">
        <div className="paleta">
          {PALETA.map((c) => (
            <div key={c.token} className="paleta-item">
              <div className="paleta-muestra" style={{ backgroundColor: c.hex }} />
              <p className="card-name">{c.token}</p>
              <p className="body-s text-muted">{c.hex}</p>
              <p className="body-s text-muted">{c.uso}</p>
            </div>
          ))}
        </div>

        <h3 className="sistema-sub">Contraste verificado contra WCAG AA</h3>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Combinacion</th>
                <th>Ratio</th>
                <th>Veredicto</th>
              </tr>
            </thead>
            <tbody>
              {CONTRASTES.map((c) => (
                <tr key={c.par}>
                  <td>{c.par}</td>
                  <td>{c.ratio}</td>
                  <td>{c.pasa ? 'Pasa' : 'No pasa — prohibido para texto'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="field-hint measure">
          Ochre nunca es color de texto sobre fondo claro: es linea, borde, icono, hover y anillo de
          foco. Y sobre Sahara el texto secundario vuelve a Umber pleno — <code>--text-muted</code>{' '}
          ahi da 4.10:1. Esa correccion no estaba en el SPEC y se resolvio con la clase{' '}
          <code>.on-sahara</code>.
        </p>
      </Bloque>

      {/* ---------------- Tipografia ---------------- */}
      <Bloque numero="02" titulo="Tipografia">
        <p className="field-hint measure">
          Cormorant Garamond es la voz emocional. Jost es la voz funcional. Un precio nunca va en
          serif; un manifiesto nunca va en sans.
        </p>
        <div className="escala">
          <Muestra nota="Display XL · Cormorant 300 · clamp(40, 7vw, 72)">
            <p className="display-xl">Tu segunda piel</p>
          </Muestra>
          <Muestra nota="Display L · Cormorant 300 · clamp(32, 5vw, 52)">
            <p className="display-l">Hecha para quedarse</p>
          </Muestra>
          <Muestra nota="Titulo · Cormorant 300 · clamp(24, 3vw, 36)">
            <p className="title">Tres promesas</p>
          </Muestra>
          <Muestra nota="Quote · Cormorant 300 italica — manifiesto">
            <p className="quote measure">
              Lo que llevas puesto deberia sentirse tan bien como lo que eres.
            </p>
          </Muestra>
          <Muestra nota="Nombre de producto · Cormorant 400 · 24px">
            <p className="product-name">Legging Duna</p>
          </Muestra>
          <Muestra nota="Precio · Jost 400 · 22px · tabular">
            <p className="price">{formatCOP(145000)}</p>
          </Muestra>
          <Muestra nota="Cuerpo · Jost 300 · 16px · line-height 1.7">
            <p className="body measure">
              Tela que se siente como tu propia piel. Segunda capa, no disfraz. Cada textura pensada
              para que la olvides puesta.
            </p>
          </Muestra>
          <Muestra nota="Cuerpo S · Jost 300 · 14px">
            <p className="body-s measure text-muted">
              Del yoga al cafe, del gym a la calle. Prendas que se adaptan a como vives.
            </p>
          </Muestra>
          <Muestra nota="Label · Jost 400 · 11px · tracking 0.4em">
            <p className="label">Nueva coleccion</p>
          </Muestra>
          <Muestra nota="Card name · Jost 400 · 14px · tracking 0.1em">
            <p className="card-name">Legging Duna</p>
          </Muestra>
        </div>
      </Bloque>

      {/* ---------------- Logo ---------------- */}
      <Bloque numero="03" titulo="Logo">
        <p className="field-hint measure">
          Los SVG viven en <code>currentColor</code>: un solo archivo sirve para cualquier color de
          la paleta y se controla desde CSS. No hay version positiva y negativa por separado.
          Principal y Wordmark anaden un segundo tono opcional en <code>--logo-acento</code> — el
          punto del isotipo y SPORTSWEAR: sin esa variable salen monocromos y siguen sirviendo
          sobre cualquier fondo. En el header ese tono es <code>--text-muted</code>, para que
          SPORTSWEAR lea como la linea secundaria que es.
        </p>
        <div className="logo-grid">
          <div className="logo-caja">
            <LogoPrincipal alto={70} title="NUDE SPORTSWEAR" />
            <p className="field-hint">Principal 70px</p>
          </div>
          <div className="logo-caja on-dark">
            <LogoPrincipal alto={70} title="NUDE SPORTSWEAR" />
            <p className="field-hint">Principal sobre Umber — monocromo sin --logo-acento</p>
          </div>
          <div className="logo-caja">
            <LogoNude alto={48} title="NUDE SPORTSWEAR" />
            <p className="field-hint">Wordmark 48px — header desktop</p>
          </div>
          <div className="logo-caja">
            <LogoNude alto={40} title="NUDE SPORTSWEAR" />
            <p className="field-hint">Wordmark 40px — header movil, y el minimo</p>
          </div>
          <div className="logo-caja on-dark">
            <LogoNude alto={40} title="NUDE SPORTSWEAR" />
            <p className="field-hint">Sobre Umber — mismo archivo</p>
          </div>
          <div className="logo-caja">
            <div className="flex items-end gap-6">
              <MarcaNude alto={48} />
              <MarcaNude alto={32} />
              <MarcaNude alto={24} />
              <MarcaNude alto={16} />
            </div>
            <p className="field-hint">Isotipo 48 / 32 / 24 / 16px</p>
          </div>
        </div>
      </Bloque>

      {/* ---------------- Botones ---------------- */}
      <Bloque numero="04" titulo="Botones y links">
        <div className="demo-fila">
          <Boton>Agregar al carrito</Boton>
          <Boton variante="secundario">Ver todo</Boton>
          <Boton disabled>Agotado por ahora</Boton>
          <Boton cargando>Confirmar pedido</Boton>
        </div>
        <div className="demo-fila on-dark demo-oscura">
          <Boton variante="invert">Finalizar compra</Boton>
          <Boton variante="outline-invert">Seguir viendo</Boton>
        </div>
        <div className="demo-fila">
          <BotonLink href="/sistema" ancho variante="primario" className="max-w-sm">
            Boton de ancho completo
          </BotonLink>
        </div>
        <div className="demo-fila items-center">
          <a href="#contenido" className="link body">
            Link con subrayado
          </a>
          <a href="#contenido" className="link-nav card-name">
            Link de navegacion
          </a>
        </div>
        <p className="field-hint measure">
          Todo boton mide al menos 44px de alto y tiene estado de carga: tres puntos en secuencia,
          nada gira. El hover de primario pasa a Ochre y sube 1px en 200ms.
        </p>
      </Bloque>

      {/* ---------------- Formularios ---------------- */}
      <Bloque numero="05" titulo="Formularios">
        <div className="dos-columnas">
          <DemoFormulario />
          <div className="flex flex-col gap-4">
            <p className="field-hint">
              Escribe menos de 10 digitos en el celular y sal del campo: el error aparece debajo con{' '}
              <code>role=&quot;alert&quot;</code>, borde Ochre e icono. Nunca rojo — el rojo es el
              unico color que romperia Desert Dune, y un error no necesita gritar para entenderse.
            </p>
            <p className="field-hint">
              La etiqueta siempre esta visible. El placeholder es ejemplo, no etiqueta.
            </p>
            <p className="field-hint">
              El boton de enviar simula 1.4s de carga para ver el estado. Nada cambia en 0ms.
            </p>
          </div>
        </div>
      </Bloque>

      {/* ---------------- Selectores ---------------- */}
      <Bloque numero="06" titulo="Selectores de producto">
        <DemoSelectores />
      </Bloque>

      {/* ---------------- Acordeon ---------------- */}
      <Bloque numero="07" titulo="Acordeon">
        <div className="measure">
          <Acordeon>
            <ItemAcordeon titulo="Envios y entregas">
              Llega en 2 a 4 dias habiles. El costo se calcula al elegir tu ciudad:{' '}
              {formatCOP(14000)} en el area metropolitana y {formatCOP(20000)} en el resto del pais.
            </ItemAcordeon>
            <ItemAcordeon titulo="Cambios y devoluciones">
              Tienes 15 dias para cambiar la talla. La prenda vuelve sin uso y con su etiqueta.
            </ItemAcordeon>
            <ItemAcordeon titulo="Como cuidar tu prenda">
              Lavado a mano o ciclo delicado en agua fria. Sin secadora, sin blanqueador. Secar a la
              sombra.
            </ItemAcordeon>
          </Acordeon>
        </div>
        <p className="field-hint measure">
          Todos cerrados por defecto, pero el contenido siempre esta en el DOM: se colapsa con{' '}
          <code>grid-template-rows</code>, no con <code>display: none</code>. Google lo indexa
          igual.
        </p>
      </Bloque>

      {/* ---------------- Iconos, badges, placeholder ---------------- */}
      <Bloque numero="08" titulo="Iconos y piezas sueltas">
        <div className="demo-fila items-center">
          <Truck size={20} weight="light" className="text-line" />
          <Wallet size={20} weight="light" className="text-line" />
          <ArrowsClockwise size={20} weight="light" className="text-line" />
          <Ruler size={20} weight="light" className="text-line" />
          <span className="field-hint">Phosphor, peso light, 20px, color --line</span>
        </div>
        <div className="demo-fila items-center">
          <span className="badge">Ultimas unidades</span>
          <span className="badge badge-solid">Agotado por ahora</span>
          <span className="price">{formatCOP(145000)}</span>
          <span className="price-sm">{formatCOP(89000)}</span>
        </div>
        <div className="placeholder-demo">
          <div className="img-placeholder ratio-3-4">
            <ImageSquare size={32} weight="light" />
          </div>
          <p className="field-hint">
            Marca de posicion 3:4 con el espacio ya reservado. Mientras no haya fotografia de
            producto, esto mantiene el CLS en cero.
          </p>
        </div>
      </Bloque>

      {/* ---------------- El trazo ---------------- */}
      <Bloque numero="09" titulo="El trazo continuo">
        <p className="field-hint measure">
          El isotipo es un trazo caligrafico continuo: la N y su punto se dibujan sin levantar la
          mano. Ese principio se vuelve el sistema estructural del sitio — una sola linea Ochre de
          1px que desciende, se desplaza en cada cambio de seccion y vuelve a bajar. Se dibuja con{' '}
          <code>pathLength=&quot;1&quot;</code> y <code>stroke-dashoffset</code>, sin medir nada con
          JavaScript. Con <code>prefers-reduced-motion</code> aparece dibujada, sin animacion.
        </p>
        <div className="trazo-demo">
          <div>
            <TrazoColumna alto={140} />
            <p className="field-hint">Columna</p>
          </div>
          <div>
            <TrazoPaso direccion="derecha" />
            <p className="field-hint">Paso a la derecha</p>
          </div>
          <div>
            <TrazoPaso direccion="izquierda" />
            <p className="field-hint">Paso a la izquierda</p>
          </div>
          <div>
            <TrazoCierre />
            <p className="field-hint">Cierre con punto</p>
          </div>
        </div>
      </Bloque>

      {/* ---------------- Superficies ---------------- */}
      <Bloque numero="10" titulo="Superficies">
        <div className="superficies">
          <div className="superficie">
            <p className="card-name">Cream — base</p>
            <p className="body-s text-muted">Texto secundario en --text-muted. 4.93:1.</p>
          </div>
          <div className="superficie on-sahara">
            <p className="card-name">Sahara — .on-sahara</p>
            <p className="body-s text-muted">
              Aqui --text-muted se redefine a Umber pleno. 6.88:1.
            </p>
          </div>
          <div className="superficie on-dark">
            <p className="card-name">Umber — .on-dark</p>
            <p className="body-s text-muted">Texto secundario en Dune. 5.20:1.</p>
          </div>
        </div>
        <p className="field-hint measure">
          La separacion se hace con color de fondo y linea Ochre al 25%. Sin sombras: el token{' '}
          <code>--shadow-*</code> esta borrado del tema, asi que <code>shadow-md</code> no compila.
          Radio 2px en todo, salvo el swatch de color.
        </p>
      </Bloque>

      {/* ---------------- Card de producto ---------------- */}
      <Bloque numero="11" titulo="Card de producto">
        <Muestra nota="Imagen 3:4, cruce a la segunda foto en 300ms al pasar el mouse o al enfocar con teclado. Sin zoom, sin sombra, sin levantar. El badge sale del stock, no de un campo del archivo.">
          <GridProducto productos={muestraProductos} />
        </Muestra>
      </Bloque>
    </div>
  )
}

function Bloque({
  numero,
  titulo,
  children,
}: {
  numero: string
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="sistema-bloque">
      <div className="container-nude">
        <header className="sistema-bloque-head">
          <span className="label text-muted">{numero}</span>
          <h2 className="title">{titulo}</h2>
        </header>
        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </section>
  )
}

function Muestra({ nota, children }: { nota: string; children: React.ReactNode }) {
  return (
    <div className="muestra">
      <div>{children}</div>
      <p className="field-hint muestra-nota">{nota}</p>
    </div>
  )
}
