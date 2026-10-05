import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { decidirTratamiento, ErrorFoto, procesarFoto, validarArchivo } from './fotos-proceso'

function imagen(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: { r: 92, g: 61, b: 40 } } }).jpeg().toBuffer()
}

describe('decidirTratamiento', () => {
  it('recorta entre 0.6 y 0.9 inclusive, paspartu fuera', () => {
    expect(decidirTratamiento(600, 1000)).toBe('recorte')
    expect(decidirTratamiento(900, 1000)).toBe('recorte')
    expect(decidirTratamiento(530, 1000)).toBe('paspartu') // collage de tres poses
    expect(decidirTratamiento(1200, 900)).toBe('paspartu') // flatlay
  })
})

describe('procesarFoto', () => {
  it('saca 480 y 960 en avif, webp y jpg, siempre 3:4', async () => {
    const salida = await procesarFoto(await imagen(1200, 1500))
    expect(salida.map((m) => `${m.ancho}.${m.formato}`)).toEqual([
      '480.avif',
      '480.webp',
      '480.jpg',
      '960.avif',
      '960.webp',
      '960.jpg',
    ])
    for (const m of salida) {
      const meta = await sharp(m.datos).metadata()
      expect(meta.width).toBe(m.ancho)
      expect(meta.height).toBe(Math.round((m.ancho * 4) / 3))
    }
  })

  it('pone un flatlay horizontal sobre paspartu Cream sin recortarlo', async () => {
    const salida = await procesarFoto(await imagen(1600, 900))
    const jpg = salida.find((m) => m.ancho === 480 && m.formato === 'jpg')!
    // La esquina superior es paspartu (Cream), el centro es la foto (Umber).
    const { data } = await sharp(jpg.datos).raw().toBuffer({ resolveWithObject: true })
    expect(data[0]).toBeGreaterThan(230)
    const centro = (320 * 480 + 240) * 3
    expect(data[centro]).toBeLessThan(120)
  })

  it('aplica la orientacion EXIF antes de recortar', async () => {
    // 1500x1000 horizontal con orientacion 6 = vertical 1000x1500 al mostrarla: se recorta, no se rellena.
    const girada = await sharp(await imagen(1500, 1000)).withMetadata({ orientation: 6 }).jpeg().toBuffer()
    const salida = await procesarFoto(girada)
    const jpg = salida.find((m) => m.ancho === 480 && m.formato === 'jpg')!
    const { data } = await sharp(jpg.datos).raw().toBuffer({ resolveWithObject: true })
    expect(data[0]).toBeLessThan(120) // sin paspartu en la esquina
  })

  it('rechaza lo que no es una foto con un mensaje claro', async () => {
    await expect(procesarFoto(Buffer.from('no soy una foto'), { nombre: 'nota.txt' })).rejects.toBeInstanceOf(ErrorFoto)
    await expect(procesarFoto(Buffer.from('xx'), { nombre: 'IMG_1.HEIC', tipo: 'image/heic' })).rejects.toThrow(/HEIC/)
  })
})

describe('validarArchivo', () => {
  it('rechaza mas de 15 MB y tipos que no son foto', () => {
    expect(validarArchivo('a.jpg', 'image/jpeg', 16 * 1024 * 1024)).toMatch(/15 MB/)
    expect(validarArchivo('a.pdf', 'application/pdf', 1000)).toMatch(/JPG, PNG o WebP/)
    expect(validarArchivo('a.jpg', 'image/jpeg', 1000)).toBeNull()
  })
})
