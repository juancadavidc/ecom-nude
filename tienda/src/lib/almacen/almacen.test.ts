import { describe, expect, it } from 'vitest'
import { GET as fotoCatalogo } from '@/app/fotos/p/[archivo]/route'
import { almacen, esClaveSegura, servirObjeto, tipoDeClave } from '.'

const params = (archivo: string) => ({ params: Promise.resolve({ archivo }) })

describe('claves', () => {
  it('acepta claves normales y rechaza las que escapan del almacen', () => {
    expect(esClaveSegura('fotos/p/legging-rib-1-480.jpg')).toBe(true)
    expect(esClaveSegura('../secreto')).toBe(false)
    expect(esClaveSegura('media//x')).toBe(false)
    expect(esClaveSegura('')).toBe(false)
  })

  it('deduce el tipo por la extension', () => {
    expect(tipoDeClave('a-480.avif')).toBe('image/avif')
    expect(tipoDeClave('a-480.jpg')).toBe('image/jpeg')
  })
})

describe('almacen local', () => {
  it('guarda, sirve con cache inmutable y borra', async () => {
    const clave = `media/prueba-${crypto.randomUUID()}-480.webp`
    await almacen().guardar(clave, Buffer.from('hola'), 'image/webp')

    const res = await servirObjeto(clave)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/webp')
    expect(res.headers.get('Cache-Control')).toContain('immutable')
    expect(await res.text()).toBe('hola')

    await almacen().borrar([clave])
    expect((await servirObjeto(clave)).status).toBe(404)
  })
})

describe('/fotos/p/[archivo]', () => {
  it('sirve el catalogo inicial desde el almacen', async () => {
    await almacen().guardar('fotos/p/prueba-1-480.jpg', Buffer.from([1, 2]), 'image/jpeg')
    const res = await fotoCatalogo(new Request('http://x'), params('prueba-1-480.jpg'))
    expect(res.status).toBe(200)
    await almacen().borrar(['fotos/p/prueba-1-480.jpg'])
  })

  it('no acepta nombres fuera del esquema', async () => {
    expect((await fotoCatalogo(new Request('http://x'), params('..%2Fx-480.jpg'))).status).toBe(404)
  })
})
