import { cx } from '@/lib/format'

/**
 * Foto a sangre que llena su contenedor (el padre pone `position: relative`).
 *
 * No usa `next/image` a proposito: las variantes ya salen precalculadas de
 * `scripts/gen-fotos.mjs` (AVIF/WebP/JPG en varios anchos), asi que no hace
 * falta el optimizador de Next en tiempo de ejecucion. Aqui solo se declaran:
 * AVIF primero, WebP despues y JPG de red de seguridad.
 *
 * `alt` es obligatorio y sin valor por defecto: una foto de fondo puede ser
 * decorativa (`alt=""`) o llevar informacion, y esa decision es de quien la
 * pone, no del componente.
 */
type FotoFondoProps = {
  /** Nombre base del archivo en `public/fotos`, sin ancho ni extension. */
  nombre: string
  alt: string
  /** Anchos generados para esa foto. Los escribe `gen-fotos.mjs` en consola. */
  anchos: number[]
  /** Dimensiones del original: fijan la relacion de aspecto y evitan el salto. */
  ancho: number
  alto: number
  /** `true` en la foto del primer pantallazo: sin lazy y con prioridad de red. */
  prioridad?: boolean
  sizes?: string
  className?: string
}

export function FotoFondo({
  nombre,
  alt,
  anchos,
  ancho,
  alto,
  prioridad = false,
  sizes = '100vw',
  className,
}: FotoFondoProps) {
  const srcSet = (ext: string) =>
    anchos.map((w) => `/fotos/${nombre}-${w}.${ext} ${w}w`).join(', ')
  const mayor = anchos[anchos.length - 1]

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={`/fotos/${nombre}-${mayor}.jpg`}
        srcSet={srcSet('jpg')}
        sizes={sizes}
        alt={alt}
        width={ancho}
        height={alto}
        loading={prioridad ? 'eager' : 'lazy'}
        fetchPriority={prioridad ? 'high' : undefined}
        decoding="async"
        className={cx('foto-fondo', className)}
      />
    </picture>
  )
}
