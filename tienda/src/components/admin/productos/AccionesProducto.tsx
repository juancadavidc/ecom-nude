'use client'

import { useState, useTransition } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { Boton } from '@/components/ui/Button'
import { Archive, Trash } from '@/components/ui/icons'
import { archivarProducto, eliminarProducto } from '@/lib/admin/acciones-productos'
import { INICIAL, type Resultado } from '@/lib/admin/resultado'

/**
 * Archivar (volver a borrador) es la salida recomendada: no se pierde nada.
 * Eliminar pide confirmacion en el mismo lugar, sin modal.
 */
export function AccionesProducto({ id, nombre, estado }: { id: string; nombre: string; estado: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [resultado, setResultado] = useState<Resultado>(INICIAL)
  const [archivando, iniciarArchivo] = useTransition()
  const [eliminando, iniciarEliminar] = useTransition()

  return (
    <div className="adm-campos">
      {estado !== 'borrador' && (
        <div className="adm-peligro">
          <Boton
            type="button"
            variante="secundario"
            className="adm-btn-sm"
            cargando={archivando}
            onClick={() => iniciarArchivo(async () => setResultado(await archivarProducto(id)))}
          >
            <Archive size={16} weight="light" aria-hidden />
            Archivar
          </Boton>
          <p className="adm-s adm-muted">Pasa a borrador: sale de la tienda y conserva todo.</p>
        </div>
      )}
      {!confirmando ? (
        <div className="adm-peligro">
          <Boton type="button" variante="secundario" className="adm-btn-sm" onClick={() => setConfirmando(true)}>
            <Trash size={16} weight="light" aria-hidden />
            Eliminar producto
          </Boton>
        </div>
      ) : (
        <div className="adm-confirmar" role="group" aria-label="Confirmar eliminación">
          <p>
            ¿Eliminar &ldquo;{nombre}&rdquo; para siempre? Se borran sus colores, tallas y fotos. Esto no se puede
            deshacer.
          </p>
          <div className="adm-acciones">
            <Boton
              type="button"
              className="adm-btn-sm"
              cargando={eliminando}
              onClick={() => iniciarEliminar(async () => setResultado(await eliminarProducto(id)))}
            >
              Sí, eliminar
            </Boton>
            <Boton type="button" variante="secundario" className="adm-btn-sm" onClick={() => setConfirmando(false)}>
              No, conservarlo
            </Boton>
          </div>
        </div>
      )}
      <Aviso resultado={resultado} />
    </div>
  )
}
