'use client'

import Form from 'next/form'
import { useRef } from 'react'
import { Boton } from '@/components/ui/Button'
import { MagnifyingGlass } from '@/components/ui/icons'

/**
 * Busqueda y categoria viven en la URL (GET): se pueden recargar, compartir y
 * volver atras. La categoria se aplica al elegirla; la busqueda con Enter o el
 * boton.
 */
export function FiltrosProductos({
  q,
  categoria,
  estado,
  categorias,
}: {
  q: string
  categoria: string
  estado: string
  categorias: { slug: string; nombre: string }[]
}) {
  const form = useRef<HTMLFormElement>(null)
  return (
    <Form action="/admin/productos" ref={form} className="adm-filtros" role="search">
      {estado && <input type="hidden" name="estado" value={estado} />}
      <div className="field">
        <label className="visually-hidden" htmlFor="buscar">
          Buscar producto
        </label>
        <div className="adm-buscar">
          <MagnifyingGlass size={18} weight="light" aria-hidden />
          <input
            id="buscar"
            name="q"
            type="search"
            className="input"
            defaultValue={q}
            placeholder="Nombre, marca, color o SKU"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
      </div>
      <div className="field">
        <label className="visually-hidden" htmlFor="filtro-categoria">
          Categoría
        </label>
        <select
          id="filtro-categoria"
          name="categoria"
          className="select"
          defaultValue={categoria}
          onChange={() => form.current?.requestSubmit()}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <Boton type="submit" variante="secundario" className="adm-btn-sm">
        Buscar
      </Boton>
    </Form>
  )
}
