import type { Metadata } from 'next'
import { BotonGoogle } from './BotonGoogle'

/**
 * Login temporal para probar el guardia de /admin (Better Auth + Google SSO).
 * Las pantallas reales del panel tienen su propio spec — esto es solo la puerta.
 *
 * Vive dentro de `(tienda)` para heredar Header/Footer: aunque es una
 * herramienta interna, no tiene sentido que se vea como una pagina rota fuera
 * del sistema de diseno. No se indexa ni se enlaza desde la navegacion.
 */
export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="login">
      <p className="label text-muted">Acceso interno</p>
      <h1 className="title">Entrar al panel</h1>
      <p className="body text-muted measure">
        Solo para el equipo de Nude. Inicia sesion con la cuenta de Google autorizada.
      </p>
      <BotonGoogle />
    </div>
  )
}
