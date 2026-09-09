'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Producto, Talla, Variante } from '@/lib/producto-modelo'
import { coloresDe, stockDe, tallasDe, varianteDe } from '@/lib/producto-modelo'

/**
 * Color y talla elegidos en la ficha. Es el unico estado con el que la clienta
 * juega antes de comprar, y tres piezas separadas dependen de el: la galeria (a
 * la izquierda), los selectores (a la derecha) y la barra de compra (abajo, en
 * movil).
 *
 * Va por contexto y no por props para no tener que convertir toda la ficha en un
 * Client Component: el proveedor envuelve las dos columnas y los hijos de
 * servidor pasan por `children` ya renderizados. Es el mismo patron que
 * `BuscadorProvider` en el header.
 */

type ContextoVariante = {
  producto: Producto
  colores: { nombre: string; hex: string }[]
  tallas: Talla[]
  color: string
  /** null hasta que la clienta elige. Nunca se preselecciona una talla. */
  talla: Talla | null
  /** Fotos del color activo. */
  imagenes: string[]
  variante: Variante | null
  elegirColor: (color: string) => void
  elegirTalla: (talla: Talla) => void
  stockDeTalla: (talla: Talla) => number
  /**
   * Panel de confirmacion del SPEC §4.4. El estado vive aqui porque lo disparan
   * DOS botones: el de la columna de compra y el de la barra fija de movil, que
   * en movil se ven a la vez. Dos <dialog> con el mismo contenido serian dos
   * trampas de foco compitiendo — el mismo motivo por el que el buscador del
   * header tiene un solo panel y dos disparadores.
   */
  confirmado: boolean
  agregar: () => void
  cerrarConfirmacion: () => void
}

const Ctx = createContext<ContextoVariante | null>(null)

export function VarianteProvider({
  producto,
  children,
}: {
  producto: Producto
  children: ReactNode
}) {
  const colores = useMemo(() => coloresDe(producto), [producto])
  const tallas = useMemo(() => tallasDe(producto), [producto])

  const [color, setColor] = useState(colores[0].nombre)
  const [talla, setTalla] = useState<Talla | null>(null)
  const [confirmado, setConfirmado] = useState(false)

  const valor = useMemo<ContextoVariante>(
    () => ({
      producto,
      colores,
      tallas,
      color,
      talla,
      imagenes: producto.imagenes[color] ?? [],
      variante: talla ? varianteDe(producto, color, talla) : null,
      elegirColor: (nuevo) => {
        setColor(nuevo)
        // La talla se conserva solo si el color nuevo la tiene. Dejarla puesta
        // sin stock haria que el boton de comprar mintiera.
        setTalla((actual) => (actual && stockDe(producto, nuevo, actual) > 0 ? actual : null))
      },
      elegirTalla: setTalla,
      stockDeTalla: (t) => stockDe(producto, color, t),
      confirmado,
      agregar: () => setConfirmado(true),
      cerrarConfirmacion: () => setConfirmado(false),
    }),
    [producto, colores, tallas, color, talla, confirmado],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useVariante(): ContextoVariante {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVariante necesita estar dentro de VarianteProvider')
  return ctx
}
