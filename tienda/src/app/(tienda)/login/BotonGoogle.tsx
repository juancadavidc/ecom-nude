'use client'

import { useState } from 'react'
import { Boton } from '@/components/ui/Button'
import { authClient } from '@/lib/auth-client'

export function BotonGoogle() {
  const [entrando, setEntrando] = useState(false)

  return (
    <Boton
      cargando={entrando}
      onClick={() => {
        setEntrando(true)
        authClient.signIn.social({ provider: 'google', callbackURL: '/admin' })
      }}
    >
      Entrar con Google
    </Boton>
  )
}
