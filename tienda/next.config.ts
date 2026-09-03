import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Export estatico: `next build` escribe HTML/CSS/JS puro en `out/`, que es lo
   * unico que Firebase Hosting sabe servir (no corre Node, asi que no ejecuta
   * Server Components en request time). Hoy funciona porque todas las rutas se
   * prerenderizan en build.
   *
   * OJO — esto se cae en la fase 3 del SPEC. Catalogo y ficha de producto leen
   * de Firestore y necesitan renderizado dinamico; el export estatico no soporta
   * rutas dinamicas sin `generateStaticParams`, ni Server Actions, ni el
   * checkout. Antes de esa fase hay que migrar a Firebase App Hosting.
   */
  output: 'export',

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
