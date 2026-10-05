import { revalidatePath } from 'next/cache'

/**
 * Despues de cualquier cambio de catalogo: la home, el catalogo completo, la
 * grilla de la categoria y la ficha. Si el producto cambio de slug o de
 * categoria, se pasan tambien los anteriores.
 */
export function revalidarTienda(...productos: ({ categoria: string; slug: string } | null | undefined)[]) {
  revalidatePath('/')
  revalidatePath('/colecciones')
  for (const p of productos) {
    if (!p) continue
    revalidatePath(`/${p.categoria}`)
    revalidatePath(`/${p.categoria}/${p.slug}`)
  }
  revalidatePath('/admin', 'layout')
}
