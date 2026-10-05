import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { almacen, tipoDeClave } from '@/lib/almacen'
import { usarR2 } from '@/lib/almacen/env'

/**
 * Sube el catalogo inicial (`semilla/fotos/p`, lo genera scripts/gen-catalogo.mjs)
 * al almacen bajo `fotos/p/`, que es de donde lo sirve `app/fotos/p/[archivo]`.
 *
 *   npm run fotos:subir             solo las que faltan
 *   npm run fotos:subir -- --todas  todas, pisando las que ya estan
 *
 * Contra R2 si el .env tiene credenciales R2_*; si no, al directorio local de
 * desarrollo. Corre desde una maquina con el repo: la imagen de Docker no lleva
 * la semilla.
 */
const ORIGEN = path.resolve('semilla/fotos/p')
const PREFIJO = 'fotos/p/'
const EN_PARALELO = 8

async function main() {
  const todas = process.argv.includes('--todas')
  const archivos = (await readdir(ORIGEN)).filter((a) => /\.(avif|webp|jpg)$/.test(a))
  const yaEstan = new Set(todas ? [] : await almacen().listar(PREFIJO))
  const pendientes = archivos.filter((a) => !yaEstan.has(PREFIJO + a))

  console.log(
    `${usarR2() ? 'R2' : 'Almacen local'}: ${archivos.length} fotos en la semilla, ` +
      `${pendientes.length} por subir.`,
  )

  let hechas = 0
  const cola = [...pendientes]
  await Promise.all(
    Array.from({ length: EN_PARALELO }, async () => {
      for (let a = cola.shift(); a; a = cola.shift()) {
        const clave = PREFIJO + a
        await almacen().guardar(clave, await readFile(path.join(ORIGEN, a)), tipoDeClave(clave))
        hechas++
        if (hechas % 50 === 0) console.log(`  ${hechas}/${pendientes.length}`)
      }
    }),
  )
  console.log(`Listo: ${hechas} subidas.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
