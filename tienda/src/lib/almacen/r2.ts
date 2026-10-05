import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { r2Env } from './env'
import type { Almacen } from './tipos'

let cliente: S3Client | undefined

function r2(): S3Client {
  cliente ??= new S3Client({
    region: 'auto',
    endpoint: `https://${r2Env.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2Env.accessKeyId, secretAccessKey: r2Env.secretAccessKey },
  })
  return cliente
}

export const almacenR2: Almacen = {
  async guardar(clave, datos, tipo) {
    await r2().send(new PutObjectCommand({ Bucket: r2Env.bucket, Key: clave, Body: datos, ContentType: tipo }))
  },

  async leer(clave) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: r2Env.bucket, Key: clave }))
      if (!res.Body) return null
      return { cuerpo: res.Body.transformToWebStream(), tipo: res.ContentType ?? null, largo: res.ContentLength ?? null }
    } catch (error) {
      if (error instanceof NoSuchKey) return null
      throw error
    }
  },

  async borrar(claves) {
    // DeleteObjects acepta hasta 1000 claves por llamada.
    for (let i = 0; i < claves.length; i += 1000) {
      const lote = claves.slice(i, i + 1000)
      await r2().send(
        new DeleteObjectsCommand({ Bucket: r2Env.bucket, Delete: { Objects: lote.map((Key) => ({ Key })) } }),
      )
    }
  },

  async listar(prefijo) {
    const claves: string[] = []
    let token: string | undefined
    do {
      const res = await r2().send(
        new ListObjectsV2Command({ Bucket: r2Env.bucket, Prefix: prefijo, ContinuationToken: token }),
      )
      for (const o of res.Contents ?? []) if (o.Key) claves.push(o.Key)
      token = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (token)
    return claves
  },
}
