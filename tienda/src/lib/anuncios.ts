import datos from '@/content/anuncios.json'

/**
 * Barra de anuncio del header. La data vive en `src/content/anuncios.json`
 * para que una campana se cambie sin tocar componentes.
 * TODO(fase-2): el archivo pasa a `config/tienda` en Firestore. El tipo de
 * `ArchivoAnuncios` es el contrato que debe devolver ese documento.
 *
 * TODO(fase-2): el umbral de $200.000 es un placeholder — falta el real.
 *
 * El JSON lo edita una persona, no un compilador: todo lo que entra se valida
 * en `leerArchivo`. Un tono invalido no debe tumbar el build ni dejar el
 * header sin contraste, asi que cae al valor seguro.
 */

/** Solo dos tonos, y los dos pasan AA sobre su fondo (SPEC §12):
 *  `oscuro` = Umber sobre Cream 8.29:1 · `suave` = Umber sobre Dune 5.20:1.
 *  Ochre de fondo queda fuera a proposito: 3.65:1 con Umber, no pasa. */
export type TonoAnuncio = 'oscuro' | 'suave'

export type Anuncio = {
  id: string
  texto: string
  /** Destino opcional. La barra entera es el enlace. */
  href?: string
}

type ArchivoAnuncios = {
  activo: boolean
  tono: TonoAnuncio
  mensajes: readonly (Anuncio & { activo: boolean })[]
}

const TONOS: readonly string[] = ['oscuro', 'suave']

function leerArchivo(crudo: unknown): ArchivoAnuncios {
  const a = (crudo ?? {}) as Record<string, unknown>
  const mensajes = Array.isArray(a.mensajes) ? (a.mensajes as Record<string, unknown>[]) : []

  return {
    activo: a.activo === true,
    tono: TONOS.includes(a.tono as string) ? (a.tono as TonoAnuncio) : 'oscuro',
    mensajes: mensajes
      .filter((m) => typeof m.id === 'string' && typeof m.texto === 'string' && m.texto.trim())
      .map((m) => ({
        id: m.id as string,
        texto: (m.texto as string).trim(),
        href: typeof m.href === 'string' && m.href ? m.href : undefined,
        activo: m.activo === true,
      })),
  }
}

const archivo = leerArchivo(datos)

export const tonoAnuncio = archivo.tono

/**
 * El primer mensaje activo, o null si la barra esta apagada.
 * Se muestra uno solo: rotar texto automaticamente obliga a dar un control de
 * pausa (WCAG 2.2.2) y la referencia tampoco rota. Los demas quedan en el
 * archivo listos para activarse cambiando un booleano.
 */
export const anuncioVigente: Anuncio | null = archivo.activo
  ? (archivo.mensajes.find((m) => m.activo) ?? null)
  : null
