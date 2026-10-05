export type Objeto = {
  cuerpo: ReadableStream | Uint8Array
  tipo: string | null
  largo: number | null
}

/** Lo minimo que la tienda necesita de un almacen de objetos. */
export type Almacen = {
  guardar(clave: string, datos: Buffer, tipo: string): Promise<void>
  /** null si la clave no existe. */
  leer(clave: string): Promise<Objeto | null>
  borrar(claves: string[]): Promise<void>
  listar(prefijo: string): Promise<string[]>
}
