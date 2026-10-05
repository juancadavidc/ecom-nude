/**
 * Miniatura de un item del pedido. Si el color todavía no tiene foto, en vez de
 * una imagen rota va el color de la tela en un círculo sobre Sahara: la clienta
 * reconoce lo que eligió por el color, que es lo que sí sabemos.
 *
 * El hex es dato de producto (SPEC §2.1), no token de marca: por eso va en
 * estilo en línea y no como clase.
 */
export function Miniatura({ imagen, hex, color }: { imagen: string; hex: string; color: string }) {
  if (imagen) {
    // La foto ya viene redimensionada (480px, ver lib/fotos.ts) por la misma via
    // que FotoFondo; next/image no agrega nada a una miniatura de 56px.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imagen} alt="" width={56} height={75} loading="lazy" className="co-mini" />
  }
  return (
    <span className="co-mini co-mini-color" aria-hidden="true" title={color}>
      <span className="co-mini-swatch" style={hex ? { backgroundColor: hex } : undefined} />
    </span>
  )
}
