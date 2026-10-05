import 'dotenv/config'
import postgres from 'postgres'
import { almacen } from '@/lib/almacen'
import { TIPO_CONTENIDO, claveMedio } from '@/lib/admin/medios'
import { required } from '@/lib/env'
import type { Formato } from '@/lib/fotos'

/**
 * Una sola vez por ambiente, al pasar a R2: copia al almacen las fotos que el
 * panel guardo en la tabla `medios` (bytea) antes de que existiera R2. Es
 * idempotente: pisa con los mismos bytes. La tabla no se borra aqui; se retira
 * con una migracion propia cuando todos los ambientes ya corrieron esto.
 *
 *   node medios-a-r2.mjs        (dentro del contenedor)
 *   npm run medios:a-r2         (en local)
 */
async function main() {
  const sql = postgres(required('DATABASE_URL'), { max: 1, onnotice: () => {} })
  try {
    const [{ existe }] = await sql<{ existe: boolean }[]>`select to_regclass('public.medios') is not null as existe`
    if (!existe) {
      console.log('No hay tabla medios: nada que copiar.')
      return
    }
    const filas = await sql<{ id: string; ancho: number; formato: Formato; datos: Buffer }[]>`
      select id, ancho, formato, datos from medios order by id, ancho, formato`
    for (const f of filas) {
      await almacen().guardar(claveMedio(f.id, f.ancho, f.formato), f.datos, TIPO_CONTENIDO[f.formato])
    }
    console.log(`Copiadas ${filas.length} variantes de ${new Set(filas.map((f) => f.id)).size} fotos.`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
