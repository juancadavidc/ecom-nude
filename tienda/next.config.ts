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
  experimental: {
    serverActions: {
      /**
       * Las fotos del panel suben por Server Action, una por llamada. El tope
       * por foto es 15 MB (`MAX_BYTES` en src/lib/admin/fotos-proceso.ts); el
       * MB extra cubre las cabeceras del multipart. Sin esto Next corta en 1 MB
       * y una foto de celular nunca llega.
       */
      bodySizeLimit: '16mb',
    },
  },
}

export default nextConfig
