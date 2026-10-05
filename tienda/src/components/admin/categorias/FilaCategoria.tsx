'use client'

import { useActionState, useState, useTransition } from 'react'
import { Aviso } from '@/components/admin/Aviso'
import { BotonEnviar } from '@/components/admin/BotonEnviar'
import { Boton } from '@/components/ui/Button'
import { CampoArea, CampoTexto } from '@/components/ui/Field'
import { ArrowDown, ArrowUp, Eye, EyeSlash, PencilSimple, Trash } from '@/components/ui/icons'
import {
  alternarVisible,
  editarCategoria,
  eliminarCategoria,
  moverCategoria,
} from '@/lib/admin/acciones-categorias'
import { INICIAL, type Resultado } from '@/lib/admin/resultado'

type Categoria = {
  slug: string
  nombre: string
  intro: string
  visible: boolean
  productos: number
  publicados: number
}

export function FilaCategoria({ c, primera, ultima }: { c: Categoria; primera: boolean; ultima: boolean }) {
  const [resultado, setResultado] = useState<Resultado>(INICIAL)
  const [ocupado, iniciar] = useTransition()
  const [confirmar, setConfirmar] = useState(false)
  const [edicion, accionEditar] = useActionState(editarCategoria, INICIAL)
  const errores = edicion.errores ?? {}

  const ejecutar = (fn: () => Promise<Resultado>) => iniciar(async () => setResultado(await fn()))

  return (
    <li className="adm-cat" aria-busy={ocupado || undefined}>
      <div>
        <p className="adm-prod-nombre">
          {c.nombre}
          {!c.visible && <span className="adm-muted adm-s"> (oculta del menú)</span>}
        </p>
        <p className="adm-prod-meta">
          <span>/{c.slug}</span>
          <span>
            {c.productos === 0
              ? 'Sin productos'
              : `${c.publicados} ${c.publicados === 1 ? 'publicado' : 'publicados'} de ${c.productos}`}
          </span>
        </p>
      </div>
      <div className="adm-cat-acciones">
        <button
          type="button"
          className="adm-icono"
          disabled={primera || ocupado}
          onClick={() => ejecutar(() => moverCategoria(c.slug, -1))}
          aria-label={`Subir ${c.nombre}`}
        >
          <ArrowUp size={18} weight="light" aria-hidden />
        </button>
        <button
          type="button"
          className="adm-icono"
          disabled={ultima || ocupado}
          onClick={() => ejecutar(() => moverCategoria(c.slug, 1))}
          aria-label={`Bajar ${c.nombre}`}
        >
          <ArrowDown size={18} weight="light" aria-hidden />
        </button>
        <button
          type="button"
          className="adm-icono"
          disabled={ocupado}
          aria-pressed={c.visible}
          onClick={() => ejecutar(() => alternarVisible(c.slug))}
          aria-label={c.visible ? `${c.nombre} visible en el menú. Ocultar` : `${c.nombre} oculta. Mostrar en el menú`}
          title={c.visible ? 'Visible en el menú' : 'Oculta del menú'}
        >
          {c.visible ? <Eye size={18} weight="light" aria-hidden /> : <EyeSlash size={18} weight="light" aria-hidden />}
        </button>
      </div>

      <details className="adm-cat-editar">
        <summary>
          <PencilSimple size={16} weight="light" aria-hidden />
          Editar
        </summary>
        <form action={accionEditar} className="adm-cat-form">
          <input type="hidden" name="original" value={c.slug} />
          <div className="adm-fila">
            <CampoTexto id={`cat-${c.slug}-nombre`} name="nombre" label="Nombre" defaultValue={c.nombre} error={errores.nombre} />
            <CampoTexto
              id={`cat-${c.slug}-slug`}
              name="slug"
              label="Dirección web"
              ayuda="Si la cambias, los productos la siguen solos."
              defaultValue={c.slug}
              error={errores.slug}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <CampoArea
            id={`cat-${c.slug}-intro`}
            name="intro"
            label="Intro del catálogo"
            ayuda="Dos líneas que salen debajo del título de la categoría."
            defaultValue={c.intro}
            error={errores.intro}
            rows={3}
          />
          <div className="adm-acciones">
            <BotonEnviar className="adm-btn-sm">Guardar</BotonEnviar>
            <Aviso resultado={edicion} />
          </div>
          <div className="adm-acciones">
            {c.productos > 0 ? (
              <p className="adm-s adm-muted">
                Para borrarla, primero pasa sus {c.productos === 1 ? 'producto' : `${c.productos} productos`} a otra
                categoría.
              </p>
            ) : !confirmar ? (
              <Boton type="button" variante="secundario" className="adm-btn-sm" onClick={() => setConfirmar(true)}>
                <Trash size={16} weight="light" aria-hidden />
                Borrar categoría
              </Boton>
            ) : (
              <div className="adm-confirmar">
                <p>¿Borrar &ldquo;{c.nombre}&rdquo;? No se puede deshacer.</p>
                <Boton
                  type="button"
                  className="adm-btn-sm"
                  cargando={ocupado}
                  onClick={() => ejecutar(() => eliminarCategoria(c.slug))}
                >
                  Sí, borrar
                </Boton>
                <Boton type="button" variante="secundario" className="adm-btn-sm" onClick={() => setConfirmar(false)}>
                  No
                </Boton>
              </div>
            )}
          </div>
        </form>
      </details>
      {resultado.mensaje && <Aviso resultado={resultado} className="adm-cat-editar" />}
    </li>
  )
}
