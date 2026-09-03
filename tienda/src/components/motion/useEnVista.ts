'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * SPEC §10 — se rechazo GSAP: un fade de 12px no justifica ~50KB de libreria.
 * IntersectionObserver + CSS hace lo mismo.
 *
 * Dispara una sola vez y se desconecta: lo que ya entro no vuelve a animarse
 * al hacer scroll hacia arriba.
 */
export function useEnVista<T extends HTMLElement | SVGElement>(margen = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [enVista, setEnVista] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Navegador sin IntersectionObserver: no hay forma de saber cuando entra en
    // vista, asi que se revela de una. Nunca se deja contenido escondido.
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setEnVista(true), 0)
      return () => clearTimeout(t)
    }

    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setEnVista(true)
          io.disconnect()
        }
      },
      { rootMargin: margen, threshold: 0.05 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [margen])

  return { ref, enVista }
}
