import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Equivalente al `requireAdmin` de Express del hermano, adaptado a la forma de
 * Next: verificacion en el layout del grupo de rutas del panel en vez de
 * middleware por ruta. Las pantallas de /admin (productos, inventario, pedidos,
 * configuracion, suscriptoras) quedan fuera de este plan — esto deja los cimientos
 * de acceso para que las construya su propio spec.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}
