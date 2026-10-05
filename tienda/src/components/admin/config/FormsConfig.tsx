'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { BotonEnviar } from '@/components/admin/BotonEnviar'
import { CampoArea, CampoTexto } from '@/components/ui/Field'
import { Plus, Trash } from '@/components/ui/icons'
import { guardarSeccionConfig } from '@/lib/admin/acciones-config'
import { INICIAL } from '@/lib/admin/resultado'
import type { CodigoDescuento, Config, DatosPago } from '@/lib/config'

function Seccion({
  id,
  titulo,
  descripcion,
  seccion,
  children,
}: {
  id: string
  titulo: string
  descripcion: string
  seccion: keyof Config
  children: (errores: Partial<Record<string, string>>) => ReactNode
}) {
  const [estado, accion] = useActionState(guardarSeccionConfig, INICIAL)
  return (
    <section className="adm-seccion" aria-labelledby={id}>
      <div className="adm-seccion-cabeza">
        <h2 id={id}>{titulo}</h2>
        <p className="adm-s adm-muted">{descripcion}</p>
      </div>
      <form action={accion} className="adm-campos">
        <input type="hidden" name="seccion" value={seccion} />
        {children(estado.errores ?? {})}
        <div className="adm-acciones">
          <BotonEnviar className="adm-btn-sm">Guardar</BotonEnviar>
          <Aviso resultado={estado} />
        </div>
      </form>
    </section>
  )
}

export function FormTarifas({ valor }: { valor: Config['tarifasEnvio'] }) {
  return (
    <Seccion
      id="sec-tarifas"
      titulo="Tarifas de envío"
      descripcion="Se cobran siempre. El checkout elige una según la ciudad."
      seccion="tarifasEnvio"
    >
      {(e) => (
        <div className="adm-fila">
          <CampoTexto
            id="metro"
            name="metro"
            label="Área metropolitana"
            inputMode="numeric"
            defaultValue={String(valor.metro)}
            error={e.metro}
          />
          <CampoTexto
            id="nacional"
            name="nacional"
            label="Resto del país"
            inputMode="numeric"
            defaultValue={String(valor.nacional)}
            error={e.nacional}
          />
        </div>
      )}
    </Seccion>
  )
}

export function FormCiudades({ valor }: { valor: string[] }) {
  return (
    <Seccion
      id="sec-ciudades"
      titulo="Ciudades del área metropolitana"
      descripcion="Pagan la tarifa metropolitana. Las demás pagan la nacional."
      seccion="ciudadesMetro"
    >
      {(e) => (
        <CampoArea
          id="ciudades"
          name="ciudades"
          label="Ciudades"
          ayuda="Una por línea, con su departamento: Medellín, Antioquia. Así no se confunden municipios con el mismo nombre."
          defaultValue={valor.join('\n')}
          error={e.ciudades}
          rows={Math.min(14, valor.length + 2)}
        />
      )}
    </Seccion>
  )
}

export function FormWhatsapp({ valor }: { valor: string }) {
  return (
    <Seccion
      id="sec-whatsapp"
      titulo="WhatsApp de la tienda"
      descripcion="A este número escriben las clientas para enviar el comprobante."
      seccion="whatsapp"
    >
      {(e) => (
        <CampoTexto
          id="whatsapp"
          name="whatsapp"
          label="Número"
          ayuda="Con indicativo: 573001234567."
          inputMode="tel"
          type="tel"
          defaultValue={valor}
          error={e.whatsapp}
          className="adm-precio"
        />
      )}
    </Seccion>
  )
}

export function FormCuentas({ valor }: { valor: DatosPago }) {
  const [cuentas, setCuentas] = useState(valor.cuentas)
  const cambiar = (i: number, campo: keyof DatosPago['cuentas'][number], v: string) =>
    setCuentas((cs) => cs.map((c, j) => (j === i ? { ...c, [campo]: v } : c)))
  return (
    <Seccion
      id="sec-cuentas"
      titulo="Cuentas para transferencia"
      descripcion="Se muestran en grande al confirmar un pedido por transferencia."
      seccion="datosPago"
    >
      {(e) => (
        <div className="adm-repetible">
          <input type="hidden" name="cuentas" value={JSON.stringify(cuentas)} />
          {cuentas.length === 0 && (
            <p className="adm-muted">
              No hay cuentas. Sin una, quien pague por transferencia no sabe a dónde enviar.
            </p>
          )}
          {cuentas.map((c, i) => (
            <div key={i} className="adm-repetible-item">
              <div className="adm-repetible-item-cabeza">
                <h3>{c.banco || `Cuenta ${i + 1}`}</h3>
                <button
                  type="button"
                  className="adm-icono"
                  aria-label={`Quitar ${c.banco || `cuenta ${i + 1}`}`}
                  onClick={() => setCuentas((cs) => cs.filter((_, j) => j !== i))}
                >
                  <Trash size={18} weight="light" aria-hidden />
                </button>
              </div>
              <div className="adm-fila">
                <CampoTexto
                  id={`cuenta-${i}-banco`}
                  label="Banco o billetera"
                  placeholder="Bancolombia"
                  value={c.banco}
                  onChange={(ev) => cambiar(i, 'banco', ev.target.value)}
                  error={e[`cuentas.${i}.banco`]}
                />
                <CampoTexto
                  id={`cuenta-${i}-tipo`}
                  label="Tipo"
                  opcional
                  placeholder="Ahorros"
                  value={c.tipo}
                  onChange={(ev) => cambiar(i, 'tipo', ev.target.value)}
                />
                <CampoTexto
                  id={`cuenta-${i}-numero`}
                  label="Número"
                  inputMode="numeric"
                  value={c.numero}
                  onChange={(ev) => cambiar(i, 'numero', ev.target.value)}
                  error={e[`cuentas.${i}.numero`]}
                />
                <CampoTexto
                  id={`cuenta-${i}-titular`}
                  label="Titular"
                  value={c.titular}
                  onChange={(ev) => cambiar(i, 'titular', ev.target.value)}
                  error={e[`cuentas.${i}.titular`]}
                />
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              className="btn btn-secondary adm-btn-sm"
              onClick={() => setCuentas((cs) => [...cs, { banco: '', tipo: '', numero: '', titular: '' }])}
            >
              <Plus size={16} weight="regular" aria-hidden />
              Agregar cuenta
            </button>
          </div>
        </div>
      )}
    </Seccion>
  )
}

export function FormCodigos({ valor }: { valor: CodigoDescuento[] }) {
  const [codigos, setCodigos] = useState(valor.map((c) => ({ ...c, porcentaje: String(c.porcentaje) })))
  const cambiar = (i: number, cambio: Partial<(typeof codigos)[number]>) =>
    setCodigos((cs) => cs.map((c, j) => (j === i ? { ...c, ...cambio } : c)))
  return (
    <Seccion
      id="sec-codigos"
      titulo="Códigos de descuento"
      descripcion="Porcentaje sobre el subtotal, sin contar el envío. Apaga un código en vez de borrarlo."
      seccion="codigosDescuento"
    >
      {(e) => (
        <div className="adm-repetible">
          <input
            type="hidden"
            name="codigos"
            value={JSON.stringify(codigos.map((c) => ({ ...c, porcentaje: Number(c.porcentaje) })))}
          />
          {codigos.length === 0 && <p className="adm-muted">No hay códigos.</p>}
          {codigos.map((c, i) => (
            <div key={i} className="adm-codigo">
              <CampoTexto
                id={`codigo-${i}`}
                label="Código"
                value={c.codigo}
                autoCapitalize="characters"
                spellCheck={false}
                onChange={(ev) => cambiar(i, { codigo: ev.target.value.toUpperCase() })}
                error={e[`codigos.${i}.codigo`]}
              />
              <CampoTexto
                id={`codigo-${i}-porcentaje`}
                label="Porcentaje"
                inputMode="numeric"
                value={c.porcentaje}
                onChange={(ev) => cambiar(i, { porcentaje: ev.target.value.replace(/\D/g, '') })}
                error={e[`codigos.${i}.porcentaje`]}
              />
              <label className="adm-interruptor">
                <input type="checkbox" checked={c.activo} onChange={(ev) => cambiar(i, { activo: ev.target.checked })} />
                Activo
              </label>
              <button
                type="button"
                className="adm-icono"
                aria-label={`Quitar el código ${c.codigo}`}
                onClick={() => setCodigos((cs) => cs.filter((_, j) => j !== i))}
              >
                <Trash size={18} weight="light" aria-hidden />
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className="btn btn-secondary adm-btn-sm"
              onClick={() => setCodigos((cs) => [...cs, { codigo: '', porcentaje: '10', activo: true }])}
            >
              <Plus size={16} weight="regular" aria-hidden />
              Agregar código
            </button>
          </div>
        </div>
      )}
    </Seccion>
  )
}
