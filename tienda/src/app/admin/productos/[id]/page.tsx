import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Aviso } from '@/components/admin/Aviso'
import { EstadoProductoBadge } from '@/components/admin/Estado'
import { AccionesProducto } from '@/components/admin/productos/AccionesProducto'
import { FormProducto } from '@/components/admin/productos/FormProducto'
import { FotosProducto } from '@/components/admin/productos/FotosProducto'
import { ArrowLeft, ArrowSquareOut } from '@/components/ui/icons'
import { listarCategoriasPanel, obtenerProductoPanel, opcionesProductos } from '@/lib/admin/datos'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await obtenerProductoPanel((await params).id)
  return { title: p?.nombre ?? 'Producto' }
}

export default async function EditarProductoPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const [producto, categorias, opciones] = await Promise.all([
    obtenerProductoPanel(id),
    listarCategoriasPanel(),
    opcionesProductos(id),
  ])
  if (!producto) notFound()

  const fotosPorColor: Record<string, number> = {}
  for (const f of producto.fotos) fotosPorColor[f.color] = (fotosPorColor[f.color] ?? 0) + 1
  const colores = producto.colores.map((c) => ({ nombre: c.nombre, hex: c.hex }))
  const publicado = producto.estado !== 'borrador'

  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <Link href="/admin/productos" className="adm-volver">
            <ArrowLeft size={16} weight="light" aria-hidden />
            Productos
          </Link>
          <h1>{producto.nombre}</h1>
          <p className="adm-prod-meta">
            <EstadoProductoBadge estado={producto.estado} />
            {publicado ? (
              <Link href={`/${producto.categoria}/${producto.slug}`} target="_blank" className="link">
                Ver en la tienda
                <ArrowSquareOut size={14} weight="light" aria-hidden className="adm-icono-linea" />
              </Link>
            ) : (
              <span>No se ve en la tienda.</span>
            )}
          </p>
        </div>
      </div>

      {sp.creado && (
        <Aviso
          className="adm-aviso-pagina"
          resultado={{ ok: true, mensaje: 'Producto creado como borrador. Ahora súbele fotos a cada color y publícalo.' }}
        />
      )}

      <FormProducto
        key={producto.id}
        producto={producto}
        categorias={categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }))}
        opciones={opciones}
        fotosPorColor={fotosPorColor}
        fotos={
          <FotosProducto
            key="fotos"
            productoId={producto.id}
            colores={colores}
            fotos={producto.fotos}
            alt={producto.seo.alt || producto.nombre}
          />
        }
        peligro={<AccionesProducto key="peligro" id={producto.id} nombre={producto.nombre} estado={producto.estado} />}
      />
    </>
  )
}
