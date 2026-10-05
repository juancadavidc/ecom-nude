import type { Metadata } from 'next'
import { BloqueContenido, PaginaContenido } from '@/components/contenido/PaginaContenido'
import { leerConfig, partirCiudadMetro } from '@/lib/config'
import { formatCOP } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Envíos y entregas',
  description: 'Enviamos a todo Colombia. Llega en 2 a 4 días hábiles. Pago contra entrega o por transferencia.',
}

/** Las tarifas salen de la configuracion del panel: si cambian alla, cambian aqui. */
export default async function EnviosPage() {
  const cfg = await leerConfig()

  return (
    <PaginaContenido
      titulo="Envíos y entregas"
      intro="Enviamos a todo Colombia. Llega en 2 a 4 días hábiles."
    >
      <BloqueContenido titulo="Cuánto cuesta">
        <p>
          El envío se calcula al elegir tu ciudad en el checkout, antes de confirmar: llegas al botón
          sabiendo el total exacto.
        </p>
        <dl className="contenido-tarifas">
          <div>
            <dt>Área metropolitana</dt>
            <dd>{formatCOP(cfg.tarifasEnvio.metro)}</dd>
          </div>
          <div>
            <dt>Resto del país</dt>
            <dd>{formatCOP(cfg.tarifasEnvio.nacional)}</dd>
          </div>
        </dl>
        <p className="body-s text-muted">
          Tarifa de área metropolitana para {cfg.ciudadesMetro.map((c) => partirCiudadMetro(c).ciudad).join(', ')}.
        </p>
      </BloqueContenido>

      <BloqueContenido titulo="Cómo pagas">
        <p>
          <strong>Transferencia por Nequi o Bancolombia.</strong> Al confirmar te mostramos los
          datos de la cuenta. Envías el comprobante por WhatsApp y despachamos.
        </p>
        <p>
          <strong>Contra entrega.</strong> Pagas en efectivo cuando recibes. Antes de despachar te
          escribimos por WhatsApp para confirmar el pedido.
        </p>
      </BloqueContenido>
    </PaginaContenido>
  )
}
