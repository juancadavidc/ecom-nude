import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cx } from '@/lib/format'
import { Warning } from './icons'

/**
 * SPEC §5 y §12 — Formularios.
 * - Todo input con <label> asociado. NUNCA placeholder como etiqueta.
 * - Error con role="alert", debajo del campo, y siempre dice como resolverse.
 * - El error se marca con borde Ochre + icono + texto Umber. Nunca rojo:
 *   el rojo es el unico color que romperia Desert Dune, y un error no necesita
 *   gritar para entenderse.
 */

type BaseProps = {
  id: string
  label: string
  /** Texto de ayuda permanente, encima del control. */
  ayuda?: string
  /** Mensaje de error. Debe decir como resolverse, no solo que fallo. */
  error?: string
  opcional?: boolean
  className?: string
}

function Envoltura({
  id,
  label,
  ayuda,
  error,
  opcional,
  className,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <div className={cx('field', className)}>
      <label className="field-label" htmlFor={id}>
        {label}
        {opcional && <span className="field-optional"> (opcional)</span>}
      </label>
      {ayuda && (
        <p className="field-hint" id={`${id}-ayuda`}>
          {ayuda}
        </p>
      )}
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          <Warning size={16} weight="light" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

/** ids de los descriptores que el control debe referenciar */
function describedBy(id: string, ayuda?: string, error?: string) {
  const ids = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

export function CampoTexto({
  id,
  label,
  ayuda,
  error,
  opcional,
  className,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Envoltura
      id={id}
      label={label}
      ayuda={ayuda}
      error={error}
      opcional={opcional}
      className={className}
    >
      <input
        {...props}
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, ayuda, error)}
      />
    </Envoltura>
  )
}

export function CampoArea({
  id,
  label,
  ayuda,
  error,
  opcional,
  className,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Envoltura
      id={id}
      label={label}
      ayuda={ayuda}
      error={error}
      opcional={opcional}
      className={className}
    >
      <textarea
        {...props}
        id={id}
        className="textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, ayuda, error)}
      />
    </Envoltura>
  )
}

export function CampoLista({
  id,
  label,
  ayuda,
  error,
  opcional,
  className,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Envoltura
      id={id}
      label={label}
      ayuda={ayuda}
      error={error}
      opcional={opcional}
      className={className}
    >
      <select
        {...props}
        id={id}
        className="select"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, ayuda, error)}
      >
        {children}
      </select>
    </Envoltura>
  )
}
