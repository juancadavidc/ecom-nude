import { CheckCircle, Warning } from '@/components/ui/icons'
import type { Resultado } from '@/lib/admin/resultado'

/**
 * Respuesta de una accion, pegada a la accion. `role="status"` para el exito
 * (se anuncia sin interrumpir) y `role="alert"` para el error.
 */
export function Aviso({ resultado, className }: { resultado: Pick<Resultado, 'ok' | 'mensaje'>; className?: string }) {
  if (!resultado.mensaje) return <div role="status" aria-live="polite" className="visually-hidden" />
  const error = !resultado.ok
  return (
    <div
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
      className={['adm-aviso', className].filter(Boolean).join(' ')}
      data-tipo={error ? 'error' : 'ok'}
    >
      {error ? <Warning size={18} weight="light" aria-hidden /> : <CheckCircle size={18} weight="light" aria-hidden />}
      <span>{resultado.mensaje}</span>
    </div>
  )
}
