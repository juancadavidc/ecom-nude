'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SignOut } from '@/components/ui/icons'
import { authClient } from '@/lib/auth-client'

export function BotonSalir({ soloIcono = false }: { soloIcono?: boolean }) {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      aria-busy={saliendo || undefined}
      className={soloIcono ? 'adm-icono' : undefined}
      aria-label={soloIcono ? 'Cerrar sesión' : undefined}
    >
      <SignOut size={20} weight="light" aria-hidden />
      {!soloIcono && (saliendo ? 'Cerrando sesión' : 'Cerrar sesión')}
    </button>
  )
}
