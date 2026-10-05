import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { esClaveSegura } from './claves'
import { dirLocal } from './env'
import type { Almacen } from './tipos'

/**
 * Almacen de desarrollo y tests: la misma interfaz que R2 sobre un directorio.
 * Nunca se usa en produccion (ver `usarR2`).
 */
function ruta(clave: string): string {
  if (!esClaveSegura(clave)) throw new Error(`Clave de objeto invalida: ${clave}`)
  return path.join(path.resolve(dirLocal()), ...clave.split('/'))
}

async function recorrer(dir: string, base: string): Promise<string[]> {
  let entradas
  try {
    entradas = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const salida: string[] = []
  for (const e of entradas) {
    const clave = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) salida.push(...(await recorrer(path.join(dir, e.name), clave)))
    else salida.push(clave)
  }
  return salida
}

export const almacenLocal: Almacen = {
  async guardar(clave, datos) {
    const destino = ruta(clave)
    await mkdir(path.dirname(destino), { recursive: true })
    await writeFile(destino, datos)
  },

  async leer(clave) {
    try {
      const datos = await readFile(ruta(clave))
      return { cuerpo: new Uint8Array(datos), tipo: null, largo: datos.length }
    } catch {
      return null
    }
  },

  async borrar(claves) {
    for (const clave of claves) await rm(ruta(clave), { force: true })
  },

  async listar(prefijo) {
    const todas = await recorrer(path.resolve(dirLocal()), '')
    return todas.filter((c) => c.startsWith(prefijo))
  },
}
