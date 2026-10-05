import { FotoFondo } from '@/components/media/FotoFondo'
import { ImageSquare } from '@/components/ui/icons'
import { ANCHOS_PRODUCTO } from '@/lib/fotos'

/**
 * Foto 3:4 pequeña de las listas, o la marca de "sin foto". Acepta un nombre
 * base de foto ("p/legging-1", "/media/<id>") o, por si acaso, una URL completa
 * con extension.
 */
export function Miniatura({ ruta, alt }: { ruta: string | null; alt: string }) {
  return (
    <span className="adm-miniatura">
      {!ruta ? (
        <span className="adm-miniatura-vacia" title="Sin foto">
          <ImageSquare size={20} weight="light" aria-label="Sin foto" />
        </span>
      ) : /\.(jpe?g|png|webp|avif)$/i.test(ruta) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ruta} alt={alt} className="foto-fondo" loading="lazy" decoding="async" />
      ) : (
        <FotoFondo nombre={ruta} alt={alt} anchos={[...ANCHOS_PRODUCTO]} ancho={480} alto={640} sizes="128px" />
      )}
    </span>
  )
}
