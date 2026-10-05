'use client'

import { useFormStatus } from 'react-dom'
import { Boton, type VarianteBoton } from '@/components/ui/Button'

/** Boton de envio con estado de carga tomado del formulario que lo contiene. */
export function BotonEnviar({
  children,
  variante = 'primario',
  className,
  name,
  value,
  disabled,
}: {
  children: React.ReactNode
  variante?: VarianteBoton
  className?: string
  name?: string
  value?: string
  disabled?: boolean
}) {
  const { pending, data } = useFormStatus()
  // Con varios botones en un formulario, solo carga el que se pulso.
  const esEste = !name || data?.get(name) === value
  return (
    <Boton
      type="submit"
      variante={variante}
      className={className}
      name={name}
      value={value}
      cargando={pending && esEste}
      disabled={disabled || pending}
    >
      {children}
    </Boton>
  )
}
