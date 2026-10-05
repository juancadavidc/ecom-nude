import type { Metadata } from 'next'
import Link from 'next/link'
import { Aviso } from '@/components/admin/Aviso'
import { EstadoProductoBadge } from '@/components/admin/Estado'
import { Miniatura } from '@/components/admin/Miniatura'
import { FiltrosProductos } from '@/components/admin/productos/FiltrosProductos'
import { BotonLink } from '@/components/ui/Button'
import { ImageSquare, Plus, Star } from '@/components/ui/icons'
import { listarCategoriasPanel, listarProductosPanel, resumenProductos, type FiltroEstado } from '@/lib/admin/datos'
import { formatCOP } from '@/lib/format'

export const metadata: Metadata = { title: 'Productos' }

const SEGMENTOS: { valor: FiltroEstado | ''; nombre: string }[] = [
  { valor: '', nombre: 'Todos' },
  { valor: 'activo', nombre: 'Activos' },
  { valor: 'borrador', nombre: 'Borradores' },
  { valor: 'sin-fotos', nombre: 'Sin fotos' },
  { valor: 'agotado', nombre: 'Agotados' },
  { valor: 'proximamente', nombre: 'Próximamente' },
]

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

function uno(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? ''
}

export default async function ProductosPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = uno(sp.q)
  const categoria = uno(sp.categoria)
  const estadoCrudo = uno(sp.estado)
  const estado = SEGMENTOS.some((s) => s.valor === estadoCrudo) ? (estadoCrudo as FiltroEstado | '') : ''
  const eliminado = uno(sp.eliminado)

  const [productos, resumen, categorias] = await Promise.all([
    listarProductosPanel({ q, categoria: categoria || undefined, estado: estado || undefined }),
    resumenProductos(),
    listarCategoriasPanel(),
  ])

  const enlace = (valor: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (categoria) p.set('categoria', categoria)
    if (valor) p.set('estado', valor)
    const s = p.toString()
    return s ? `/admin/productos?${s}` : '/admin/productos'
  }

  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <h1>Productos</h1>
          <p className="adm-muted adm-s">
            {resumen.todos} en total, {resumen.activo} activos.{' '}
            {resumen['sin-fotos'] > 0 &&
              `${resumen['sin-fotos']} ${resumen['sin-fotos'] === 1 ? 'espera' : 'esperan'} fotos para poder publicarse.`}
          </p>
        </div>
        <BotonLink href="/admin/productos/nuevo">
          <Plus size={16} weight="regular" aria-hidden />
          Nuevo producto
        </BotonLink>
      </div>

      {eliminado && <Aviso resultado={{ ok: true, mensaje: `"${eliminado}" se eliminó.` }} className="adm-aviso-pagina" />}

      <nav className="adm-segmentos" aria-label="Filtrar por estado">
        {SEGMENTOS.map((s) => (
          <Link
            key={s.valor}
            href={enlace(s.valor)}
            className="adm-segmento"
            aria-current={estado === s.valor ? 'page' : undefined}
          >
            {s.nombre}
            <span className="adm-num adm-muted">{resumen[s.valor || 'todos']}</span>
          </Link>
        ))}
      </nav>

      <FiltrosProductos
        q={q}
        categoria={categoria}
        estado={estado}
        categorias={categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }))}
      />

      {productos.length === 0 ? (
        <div className="adm-vacio">
          <p>
            {q || categoria || estado
              ? 'Ningún producto coincide con esos filtros.'
              : 'Todavía no hay productos. Crea el primero y súbele fotos.'}
          </p>
          {q || categoria || estado ? (
            <BotonLink href="/admin/productos" variante="secundario">
              Quitar filtros
            </BotonLink>
          ) : null}
        </div>
      ) : (
        <>
          <p className="visually-hidden" role="status">
            {productos.length} productos
          </p>
          <div className="adm-lista-cabeza" aria-hidden>
            <span />
            <span>Producto</span>
            <span>Precio</span>
            <span>Colores</span>
            <span>Estado</span>
          </div>
          <ul className="adm-lista">
            {productos.map((p) => {
              const precio = p.precio !== p.precioMax ? `Desde ${formatCOP(p.precio)}` : formatCOP(p.precio)
              const colores = `${p.colores.length} ${p.colores.length === 1 ? 'color' : 'colores'}`
              return (
                <li key={p.id}>
                  <Link href={`/admin/productos/${p.id}`} className="adm-prod">
                    <Miniatura ruta={p.primeraFoto} alt="" />
                    <span className="adm-prod-cuerpo">
                      <span className="adm-prod-nombre">{p.nombre}</span>
                      <span className="adm-prod-meta">
                        <span>{p.categoriaNombre}</span>
                        {p.marca && <span>{p.marca}</span>}
                        {p.destacado && (
                          <span className="adm-marcador">
                            <Star size={14} weight="fill" aria-hidden />
                            Destacado
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="adm-prod-meta adm-prod-meta-movil">
                      <span className="adm-prod-precio adm-num">{precio}</span>
                      <span>{colores}</span>
                      <EstadoProductoBadge estado={p.estado} />
                      {p.fotos === 0 && (
                        <span className="adm-falta">
                          <ImageSquare size={14} weight="light" aria-hidden />
                          Sin fotos
                        </span>
                      )}
                    </span>
                    <span className="adm-prod-col adm-num">{precio}</span>
                    <span className="adm-prod-col">
                      <span className="adm-swatches" aria-hidden>
                        {p.colores.slice(0, 5).map((c) => (
                          <span key={c.nombre} style={{ backgroundColor: c.hex }} />
                        ))}
                      </span>{' '}
                      <span className="adm-muted adm-s">{colores}</span>
                    </span>
                    <span className="adm-prod-col adm-prod-estado">
                      <EstadoProductoBadge estado={p.estado} />
                      {p.fotos === 0 && (
                        <span className="adm-falta">
                          <ImageSquare size={14} weight="light" aria-hidden />
                          Sin fotos
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}
