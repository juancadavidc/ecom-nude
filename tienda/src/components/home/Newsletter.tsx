'use client'

import { useState, type FormEvent } from 'react'
import { Boton } from '@/components/ui/Button'
import { CampoTexto } from '@/components/ui/Field'
import { microcopy } from '@/lib/copy'

/**
 * SPEC §4.1 bloque 9 — franja Sahara, un input y un boton. En prelanzamiento el
 * correo es el activo mas valioso, y por eso va en la home y no solo en el pie.
 *
 * TODO(fase-6): HOY EL CORREO NO SE GUARDA EN NINGUN LADO. Falta el destino —
 * coleccion `newsletter` en Firestore o el proveedor de correo que se elija. El
 * sitio esta en `noindex` y no vende todavia, asi que el formulario no ha
 * recibido nada real, pero esto tiene que conectarse ANTES de quitar el noindex.
 *
 * Es Client Component por el SPEC §12: validacion al salir del campo, y al
 * enviar cargando -> exito o error. Nunca un clic sin respuesta.
 */
export function Newsletter() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  function validar(valor: string): string | undefined {
    if (!valor.trim()) return microcopy.newsletterError
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) return microcopy.newsletterInvalido
    return undefined
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const fallo = validar(correo)
    setError(fallo)
    if (fallo) return

    setEnviando(true)
    // TODO(fase-6): aqui va la escritura real. La espera existe para que el
    // estado de carga del boton sea visible y no un parpadeo.
    await new Promise((r) => setTimeout(r, 400))
    setEnviando(false)
    setListo(true)
  }

  return (
    <section className="on-sahara newsletter">
      <div className="container-nude">
        <p className="label text-muted">Prelanzamiento</p>
        <h2 className="title">{microcopy.newsletter}</h2>

        {listo ? (
          <p className="quote" role="status">
            {microcopy.newsletterListo}
          </p>
        ) : (
          <form className="newsletter-form" onSubmit={enviar} noValidate>
            <CampoTexto
              id="newsletter-correo"
              name="correo"
              label="Tu correo"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={correo}
              error={error}
              onChange={(e) => setCorreo(e.target.value)}
              onBlur={(e) => setError(validar(e.target.value))}
            />
            <Boton type="submit" cargando={enviando}>
              Avisame
            </Boton>
          </form>
        )}
      </div>
    </section>
  )
}
