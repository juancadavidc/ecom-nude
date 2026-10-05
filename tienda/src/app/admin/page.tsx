import { redirect } from 'next/navigation'

/** El panel abre en productos: es lo que Daniela hace todos los dias. */
export default function AdminPage() {
  redirect('/admin/productos')
}
