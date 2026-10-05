import { optional, required } from '@/lib/env'

/**
 * Credenciales de Cloudflare R2 (API compatible con S3). Igual que
 * `packages/storage/src/env.ts` de starter-next-auth: solo las exige este modulo.
 */
export const r2Env = {
  get accountId() {
    return required('R2_ACCOUNT_ID')
  },
  get accessKeyId() {
    return required('R2_ACCESS_KEY_ID')
  },
  get secretAccessKey() {
    return required('R2_SECRET_ACCESS_KEY')
  },
  get bucket() {
    return required('R2_BUCKET_NAME')
  },
}

/**
 * R2 si hay credenciales, o siempre en produccion (ahi una variable faltante
 * revienta al primer uso en vez de escribir en el disco desechable del
 * contenedor). En desarrollo y tests, sin credenciales, un directorio local.
 */
export function usarR2(): boolean {
  return Boolean(optional('R2_ACCOUNT_ID')) || process.env.NODE_ENV === 'production'
}

/** Raiz del almacen local de desarrollo. Gitignoreado. */
export function dirLocal(): string {
  return optional('ALMACEN_LOCAL_DIR') ?? '.almacen'
}
