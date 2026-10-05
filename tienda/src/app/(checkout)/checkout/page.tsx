import type { Metadata } from 'next'
import { Checkout } from '@/components/checkout/Checkout'
import { DEPARTAMENTOS } from '@/lib/colombia'
import { envioPara, leerConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Finaliza tu pedido',
  robots: { index: false, follow: false },
}

/** La tarifa y la lista metropolitana se cambian desde el panel: se leen en cada visita. */
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const cfg = await leerConfig()
  // El cliente no recibe la regla, recibe el resultado: que municipios de la
  // lista pagan tarifa metropolitana segun `envioPara`. Asi el total que ve la
  // clienta es el mismo que calcula el servidor al confirmar. La llave es
  // "Departamento|Ciudad" porque hay municipios homonimos en departamentos distintos.
  const ciudadesMetro = DEPARTAMENTOS.flatMap((d) =>
    d.municipios
      .filter(
        (m) =>
          envioPara(m, cfg, d.nombre) === cfg.tarifasEnvio.metro &&
          cfg.tarifasEnvio.metro !== cfg.tarifasEnvio.nacional,
      )
      .map((m) => `${d.nombre}|${m}`),
  )
  return (
    <div className="container-nude co-pagina">
      <Checkout tarifas={cfg.tarifasEnvio} ciudadesMetro={ciudadesMetro} />
    </div>
  )
}
