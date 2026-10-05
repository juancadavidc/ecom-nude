import type { Metadata } from 'next'
import Link from 'next/link'
import { FormProducto } from '@/components/admin/productos/FormProducto'
import { FotosProducto } from '@/components/admin/productos/FotosProducto'
import { ArrowLeft } from '@/components/ui/icons'
import { listarCategoriasPanel, opcionesProductos } from '@/lib/admin/datos'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NuevoProductoPage() {
  const [categorias, opciones] = await Promise.all([listarCategoriasPanel(), opcionesProductos()])
  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <Link href="/admin/productos" className="adm-volver">
            <ArrowLeft size={16} weight="light" aria-hidden />
            Productos
          </Link>
          <h1>Nuevo producto</h1>
          <p className="adm-muted adm-s">Se crea como borrador. Lo publicas cuando tenga fotos.</p>
        </div>
      </div>
      <FormProducto
        producto={null}
        categorias={categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }))}
        opciones={opciones}
        fotosPorColor={{}}
        fotos={<FotosProducto key="fotos" productoId={null} colores={[]} fotos={[]} alt="" />}
      />
    </>
  )
}
