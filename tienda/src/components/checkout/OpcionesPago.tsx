import { Warning } from '@/components/ui/icons'
import { checkoutCopy } from '@/lib/copy'
import type { MetodoPago } from '@/lib/pedido-modelo'

const OPCIONES: { valor: MetodoPago; titulo: string; detalle?: string; texto: string }[] = [
  {
    valor: 'transferencia',
    titulo: checkoutCopy.transferencia,
    detalle: checkoutCopy.transferenciaDetalle,
    texto: checkoutCopy.transferenciaTexto,
  },
  { valor: 'contraentrega', titulo: checkoutCopy.contraentrega, texto: checkoutCopy.contraentregaTexto },
]

/**
 * SPEC §4.5 bloque 3. Radios nativos — teclado, lector de pantalla y el
 * comportamiento de grupo salen gratis — con la fila entera como área táctil.
 */
export function OpcionesPago({
  valor,
  error,
  onCambio,
}: {
  valor: string
  error?: string
  onCambio: (valor: MetodoPago) => void
}) {
  return (
    <fieldset
      className="co-pago"
      aria-describedby={error ? 'co-metodoPago-error' : undefined}
      data-error={error ? true : undefined}
    >
      <legend className="sr-only">Cómo quieres pagar</legend>
      {OPCIONES.map((o, i) => (
        <label key={o.valor} className="co-pago-opcion" data-activo={valor === o.valor || undefined}>
          <input
            type="radio"
            name="metodoPago"
            value={o.valor}
            id={i === 0 ? 'co-metodoPago' : undefined}
            checked={valor === o.valor}
            onChange={() => onCambio(o.valor)}
            className="co-radio"
          />
          <span className="co-pago-texto">
            <span className="co-pago-titulo">
              {o.titulo}
              {o.detalle && <span className="co-pago-detalle">{o.detalle}</span>}
            </span>
            <span className="co-pago-desc">{o.texto}</span>
          </span>
        </label>
      ))}
      {error && (
        <p className="field-error" id="co-metodoPago-error" role="alert">
          <Warning size={16} weight="light" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}
