import type { Metadata } from 'next'
import { FormCiudades, FormCodigos, FormCuentas, FormTarifas, FormWhatsapp } from '@/components/admin/config/FormsConfig'
import { leerConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  const cfg = await leerConfig()
  return (
    <>
      <div className="adm-cabeza">
        <div className="adm-cabeza-texto">
          <h1>Configuración</h1>
          <p className="adm-muted adm-s">Lo que usa el checkout. Cada bloque se guarda por separado.</p>
        </div>
      </div>
      <div className="adm-form">
        <FormTarifas valor={cfg.tarifasEnvio} />
        <FormCiudades valor={cfg.ciudadesMetro} />
        <FormCuentas valor={cfg.datosPago} />
        <FormWhatsapp valor={cfg.whatsapp} />
        <FormCodigos valor={cfg.codigosDescuento} />
      </div>
    </>
  )
}
