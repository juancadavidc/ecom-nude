import { MarcaNude } from '@/components/brand/Logo'

/**
 * Lo que ocupa el lugar de la foto cuando un color todavia no tiene sesion.
 * Sahara con el isotipo en linea: se lee como "aun no", no como imagen rota.
 * Llena su contenedor igual que `FotoFondo` (el padre fija el 3:4).
 */
export function SinFoto({ texto }: { texto?: string }) {
  return (
    <div className="sin-foto on-sahara">
      <MarcaNude alto={40} className="text-line" />
      {texto && <p className="body-s text-muted">{texto}</p>}
    </div>
  )
}
