'use client'

import { useActionState, useState } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { BotonEnviar } from '@/components/admin/BotonEnviar'
import { Boton } from '@/components/ui/Button'
import { CampoArea, CampoTexto } from '@/components/ui/Field'
import { cambiarEstadoPedido, guardarGuia, guardarNotas } from '@/lib/admin/acciones-pedidos'
import { ACCION_ESTADO, type EstadoPedido } from '@/lib/admin/pedidos-estado'
import { INICIAL } from '@/lib/admin/resultado'

/**
 * Un boton por cada estado al que se puede pasar. Cancelar pide confirmacion
 * en el mismo lugar.
 */
export function CambiarEstado({ id, siguientes }: { id: string; siguientes: EstadoPedido[] }) {
  const [estado, accion] = useActionState(cambiarEstadoPedido, INICIAL)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const avanzar = siguientes.filter((e) => e !== 'cancelado')
  const puedeCancelar = siguientes.includes('cancelado')

  return (
    <form action={accion} className="adm-campos">
      <input type="hidden" name="id" value={id} />
      {avanzar.length > 0 && (
        <div className="adm-acciones">
          {avanzar.map((e, i) => (
            <BotonEnviar key={e} name="estado" value={e} variante={i === 0 ? 'primario' : 'secundario'} className="adm-btn-sm">
              {ACCION_ESTADO[e]}
            </BotonEnviar>
          ))}
        </div>
      )}
      {puedeCancelar &&
        (confirmarCancelar ? (
          <div className="adm-confirmar">
            <p>¿Cancelar este pedido? Puedes reabrirlo después.</p>
            <BotonEnviar name="estado" value="cancelado" className="adm-btn-sm">
              Sí, cancelar
            </BotonEnviar>
            <Boton type="button" variante="secundario" className="adm-btn-sm" onClick={() => setConfirmarCancelar(false)}>
              No
            </Boton>
          </div>
        ) : (
          <div>
            <button type="button" className="link adm-s" onClick={() => setConfirmarCancelar(true)}>
              Cancelar pedido
            </button>
          </div>
        ))}
      <Aviso resultado={estado} />
    </form>
  )
}

export function FormGuia({ id, guia }: { id: string; guia: string }) {
  const [estado, accion] = useActionState(guardarGuia, INICIAL)
  return (
    <form action={accion} className="adm-campos">
      <input type="hidden" name="id" value={id} />
      <CampoTexto
        id="guia"
        name="guia"
        label="Número de guía"
        ayuda="El de la transportadora, para que la clienta rastree el envío."
        defaultValue={guia}
        error={estado.errores?.guia}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="adm-acciones">
        <BotonEnviar variante="secundario" className="adm-btn-sm">
          Guardar guía
        </BotonEnviar>
        <Aviso resultado={estado} />
      </div>
    </form>
  )
}

export function FormNotas({ id, notas }: { id: string; notas: string }) {
  const [estado, accion] = useActionState(guardarNotas, INICIAL)
  return (
    <form action={accion} className="adm-campos">
      <input type="hidden" name="id" value={id} />
      <CampoArea
        id="notas"
        name="notas"
        label="Notas internas"
        ayuda="Solo las ves tú: lo que hablaste con la clienta, cambios, devoluciones."
        defaultValue={notas}
        rows={4}
      />
      <div className="adm-acciones">
        <BotonEnviar variante="secundario" className="adm-btn-sm">
          Guardar notas
        </BotonEnviar>
        <Aviso resultado={estado} />
      </div>
    </form>
  )
}
