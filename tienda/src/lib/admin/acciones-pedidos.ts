'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { pedidos as pedidosTabla } from '@/db/schema'
import { esEstadoPedido, motivoBloqueo, NOMBRE_ESTADO_PEDIDO } from './pedidos-estado'
import { exito, fallo, type Resultado } from './resultado'
import { exigirAdmin } from './sesion'

function revalidar(id: string) {
  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${id}`)
}

export async function cambiarEstadoPedido(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const id = String(formData.get('id') ?? '')
  const nuevo = formData.get('estado')
  if (!esEstadoPedido(nuevo)) return fallo('Elige un estado de la lista.')
  const [p] = await db.select().from(pedidosTabla).where(eq(pedidosTabla.id, id)).limit(1)
  if (!p) return fallo('Este pedido ya no existe.')
  const motivo = motivoBloqueo(p, nuevo)
  if (motivo) return fallo(motivo)
  await db.update(pedidosTabla).set({ estado: nuevo, actualizadoEn: new Date() }).where(eq(pedidosTabla.id, id))
  revalidar(id)
  return exito(`Pedido #${p.numero}: ${NOMBRE_ESTADO_PEDIDO[nuevo].toLowerCase()}.`)
}

export async function guardarGuia(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const id = String(formData.get('id') ?? '')
  const guia = String(formData.get('guia') ?? '').trim()
  if (guia.length > 80) return fallo('Ese número de guía es demasiado largo. Revísalo.', { guia: 'Máximo 80 caracteres.' })
  const [p] = await db
    .update(pedidosTabla)
    .set({ guia: guia || null, actualizadoEn: new Date() })
    .where(eq(pedidosTabla.id, id))
    .returning({ numero: pedidosTabla.numero })
  if (!p) return fallo('Este pedido ya no existe.')
  revalidar(id)
  return exito(guia ? 'Guía guardada.' : 'Guía borrada.')
}

export async function guardarNotas(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin()
  const id = String(formData.get('id') ?? '')
  const notas = String(formData.get('notas') ?? '').trim()
  if (notas.length > 4000) return fallo('Las notas son muy largas: resúmelas en menos de 4.000 caracteres.')
  const [p] = await db
    .update(pedidosTabla)
    .set({ notasInternas: notas, actualizadoEn: new Date() })
    .where(eq(pedidosTabla.id, id))
    .returning({ numero: pedidosTabla.numero })
  if (!p) return fallo('Este pedido ya no existe.')
  revalidar(id)
  return exito('Notas guardadas.')
}
