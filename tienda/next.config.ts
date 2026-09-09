import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Next 16 bloquea por defecto los recursos de desarrollo pedidos desde un host
   * distinto a `localhost`. Sin esto, abrir el dev server por IP —desde el
   * celular en la misma red, que es como se revisa el movil de verdad— carga el
   * HTML pero mata el cliente de HMR y con el la hidratacion: la pagina se ve
   * pero nada responde. Se permiten loopback y rangos de red local privada.
   */
  allowedDevOrigins: ['127.0.0.1', '192.168.0.0/16', '10.0.0.0/8'],
}

export default nextConfig
