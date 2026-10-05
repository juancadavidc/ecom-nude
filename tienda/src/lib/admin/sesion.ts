import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

/**
 * El guardia de `app/admin/layout.tsx` protege las paginas, no las Server
 * Actions: una accion es un POST que se puede llamar sin pasar por el layout.
 * Por eso cada accion del panel empieza llamando a esto.
 */
export async function exigirAdmin() {
  const sesion = await auth.api.getSession({ headers: await headers() })
  if (!sesion || sesion.user.role !== 'admin') {
    throw new Error('No autorizado')
  }
  return sesion
}
