'use client'

import { useActionState, useState } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { BotonEnviar } from '@/components/admin/BotonEnviar'
import { CampoArea, CampoTexto } from '@/components/ui/Field'
import { crearCategoria } from '@/lib/admin/acciones-categorias'
import { INICIAL } from '@/lib/admin/resultado'
import { slugificar } from '@/lib/producto-modelo'

export function NuevaCategoria() {
  const [estado, accion] = useActionState(crearCategoria, INICIAL)
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [tocado, setTocado] = useState(false)
  const errores = estado.errores ?? {}

  // Creada: el formulario vuelve a quedar vacio. Se ajusta en el render, no en un efecto.
  const [vista, setVista] = useState(estado.t)
  if (estado.t !== vista) {
    setVista(estado.t)
    if (estado.ok) {
      setNombre('')
      setSlug('')
      setTocado(false)
    }
  }

  return (
    <form action={accion} className="adm-campos">
      <div className="adm-fila">
        <CampoTexto
          id="nueva-nombre"
          name="nombre"
          label="Nombre"
          placeholder="Bodys"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <CampoTexto
          id="nueva-slug"
          name="slug"
          label="Dirección web"
          ayuda="Se arma sola con el nombre."
          value={tocado ? slug : slugificar(nombre)}
          onChange={(e) => {
            setTocado(true)
            setSlug(e.target.value)
          }}
          error={errores.slug}
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <CampoArea id="nueva-intro" name="intro" label="Intro del catálogo" opcional rows={2} error={errores.intro} />
      <div className="adm-acciones">
        <BotonEnviar>Crear categoría</BotonEnviar>
        <Aviso resultado={estado} />
      </div>
    </form>
  )
}
