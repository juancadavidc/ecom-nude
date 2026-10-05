import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BotonSalir } from '@/components/admin/BotonSalir'
import { NavAdmin } from '@/components/admin/NavAdmin'
import { MarcaNude } from '@/components/brand/Logo'
import { Storefront } from '@/components/ui/icons'
import { auth } from '@/lib/auth'
import './admin.css'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel NUDE' },
  robots: { index: false, follow: false },
}

/**
 * Guardia de sesion del panel: verificacion en el layout del grupo de rutas
 * en vez de middleware por ruta. OJO: esto protege las PAGINAS. Las Server
 * Actions son POST que no pasan por aqui; cada una llama `exigirAdmin()`
 * (src/lib/admin/sesion.ts) por su cuenta.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="adm">
      <header className="adm-superior">
        <Link href="/admin/productos" className="adm-marca">
          <MarcaNude alto={26} />
          Panel
        </Link>
        <div className="adm-superior-acciones">
          <Link href="/" className="adm-icono" aria-label="Ver la tienda" target="_blank">
            <Storefront size={20} weight="light" aria-hidden />
          </Link>
          <BotonSalir soloIcono />
        </div>
      </header>

      <aside className="adm-lateral">
        <Link href="/admin/productos" className="adm-marca">
          <MarcaNude alto={28} />
          Panel
        </Link>
        <NavAdmin forma="lateral" />
        <div className="adm-lateral-pie">
          <Link href="/" target="_blank">
            <Storefront size={20} weight="light" aria-hidden />
            Ver la tienda
          </Link>
          <BotonSalir />
          <p className="adm-usuario">{session.user.email}</p>
        </div>
      </aside>

      <main className="adm-main" id="contenido">
        {children}
      </main>

      <NavAdmin forma="tabs" />
    </div>
  )
}
