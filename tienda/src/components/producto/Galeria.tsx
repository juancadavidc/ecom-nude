'use client'

import { useEffect, useRef, useState } from 'react'
import { FotoFondo } from '@/components/media/FotoFondo'
import { useVariante } from './Variante'

/**
 * SPEC §4.3 — miniaturas verticales mas imagen principal en escritorio; en movil,
 * carrusel a ancho completo con puntos.
 *
 * Es el mismo marcado en los dos casos y lo resuelve el CSS: en movil la lista es
 * un carril con scroll-snap y en escritorio se esconde todo menos la foto activa.
 * Dos marcados distintos significarian descargar las fotos dos veces.
 */
export function Galeria({ alt }: { alt: string }) {
  const { imagenes, color } = useVariante()
  const [activa, setActiva] = useState(0)
  const pista = useRef<HTMLUListElement>(null)

  // Cambiar de color cambia el juego de fotos: la cuarta del anterior puede no
  // existir en el nuevo. Ajustar `activa` durante el render (en vez de en un
  // useEffect) es el mismo patron que `GridFiltrado` usa para su pagina:
  // react-hooks/set-state-in-effect rechaza el setState dentro del efecto
  // porque fuerza un renderizado de mas.
  const [colorVisto, setColorVisto] = useState(color)
  if (color !== colorVisto) {
    setColorVisto(color)
    setActiva(0)
  }

  // El scroll de vuelta al inicio si es un efecto de verdad: toca el DOM del
  // carril, no estado de React, y la regla no lo alcanza.
  useEffect(() => {
    pista.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [color])

  function irA(i: number) {
    setActiva(i)
    const el = pista.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: i * el.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  return (
    <div className="galeria">
      <div className="galeria-principal">
        <ul
          ref={pista}
          className="galeria-vista"
          onScroll={(e) => {
            const el = e.currentTarget
            // En escritorio el carril no desplaza: sin esta guarda, cualquier
            // scroll de la pagina devolveria la foto activa a la primera.
            if (el.scrollWidth <= el.clientWidth || !el.clientWidth) return
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== activa) setActiva(i)
          }}
        >
          {imagenes.map((foto, i) => (
            <li key={foto + i} data-activa={i === activa}>
              <FotoFondo
                nombre={foto}
                anchos={[900]}
                ancho={900}
                alto={1200}
                sizes="(min-width: 1024px) 50vw, 100vw"
                prioridad={i === 0}
                alt={`${alt}. Imagen ${i + 1} de ${imagenes.length}`}
              />
            </li>
          ))}
        </ul>

        <div className="galeria-puntos">
          {imagenes.map((foto, i) => (
            <button
              key={foto + i}
              type="button"
              className="punto"
              aria-current={i === activa}
              aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
              onClick={() => irA(i)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>

      <ul className="galeria-minis">
        {imagenes.map((foto, i) => (
          <li key={foto + i}>
            <button
              type="button"
              className="mini"
              aria-pressed={i === activa}
              aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
              onClick={() => irA(i)}
            >
              <FotoFondo
                nombre={foto}
                anchos={[900]}
                ancho={900}
                alto={1200}
                sizes="76px"
                alt=""
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
