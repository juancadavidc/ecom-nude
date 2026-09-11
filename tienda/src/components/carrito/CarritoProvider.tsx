'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  agregarItem,
  actualizarCantidad as actualizarCantidadDe,
  eliminarItem,
  totalesDe,
  type ItemCarrito,
} from '@/lib/carrito'

const CLAVE_STORAGE = 'nude-carrito'

type ContextoCarrito = {
  items: ItemCarrito[]
  cantidadTotal: number
  subtotal: number
  agregar: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void
  actualizarCantidad: (sku: string, cantidad: number) => void
  eliminar: (sku: string) => void
}

const Ctx = createContext<ContextoCarrito | null>(null)

/**
 * Arranca vacio tanto en servidor como en el primer render de cliente para no
 * desincronizar la hidratacion; un useEffect carga lo que haya en localStorage
 * justo despues de montar. Leer y escribir van en try/catch: localStorage
 * puede no existir, estar lleno o venir corrupto, y ninguno de esos casos debe
 * romper el carrito — solo deja de persistir.
 */
export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([])

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE)
      // Hidrata el estado leyendo localStorage (sistema externo) una sola vez al montar;
      // no hay evento al que suscribirse.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setItems(JSON.parse(guardado))
    } catch {
      // localStorage no disponible o el JSON guardado esta corrupto: se sigue con carrito vacio.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items))
    } catch {
      // localStorage lleno o bloqueado: el carrito sigue funcionando en memoria.
    }
  }, [items])

  const valor = useMemo<ContextoCarrito>(() => {
    const { cantidad, subtotal } = totalesDe(items)
    return {
      items,
      cantidadTotal: cantidad,
      subtotal,
      agregar: (item, cantidad = 1) => setItems((actual) => agregarItem(actual, item, cantidad)),
      actualizarCantidad: (sku, cantidad) => setItems((actual) => actualizarCantidadDe(actual, sku, cantidad)),
      eliminar: (sku) => setItems((actual) => eliminarItem(actual, sku)),
    }
  }, [items])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCarrito(): ContextoCarrito {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarrito necesita estar dentro de CarritoProvider')
  return ctx
}
