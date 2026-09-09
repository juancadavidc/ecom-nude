/**
 * Piso de calidad del SPEC §12, comprobado sobre Chrome real.
 *
 *   npm run verificar
 *
 * Corre contra `out/`, no contra el dev server: `out/` es exactamente lo que
 * Firebase Hosting publica. Un fallo que solo aparece en el export estatico —el
 * <Suspense> que no prerenderiza, la ruta dinamica que no se genero— no se ve de
 * ninguna otra forma.
 *
 * El servidor de aqui imita `cleanUrls: true` de `firebase.json`: /leggings
 * sirve out/leggings.html.
 *
 * Lo que NO comprueba y sigue siendo revision humana: contraste real sobre
 * fotografia, tono del copy y que los recortes no corten cabezas.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(here, '../out')

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const candidatos = ruta.endsWith('/')
    ? [join(RAIZ, ruta, 'index.html')]
    : [join(RAIZ, ruta), join(RAIZ, `${ruta}.html`)]

  for (const archivo of candidatos) {
    try {
      const cuerpo = await readFile(archivo)
      res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream' })
      res.end(cuerpo)
      return
    } catch {
      // siguiente candidato
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('404')
})

await new Promise((r) => servidor.listen(0, r))
const base = `http://127.0.0.1:${servidor.address().port}`

const RUTAS = [
  '/',
  '/leggings',
  '/tops',
  '/sets',
  '/colecciones',
  '/leggings/legging-duna',
  '/tops/top-umbra',
  '/sets/set-duna',
  '/sistema',
]

const ANCHOS = [375, 768, 1024, 1440]

const fallos = []
function comprobar(condicion, mensaje) {
  if (!condicion) fallos.push(mensaje)
}

const navegador = await chromium.launch()

/** Cierra navegador y servidor antes de abortar. Un `process.exit` sin esto deja
 * procesos de Chromium colgados. */
async function abortar(mensaje) {
  console.error(mensaje)
  await navegador.close()
  servidor.close()
  process.exit(1)
}

// --- 0. Autotest del arnes: ¿"sin JavaScript" apaga de verdad @media (scripting: enabled)? ---
//
// En cinco tareas anteriores nadie logro desactivar JavaScript en un navegador
// de verdad para comprobarlo a mano. Todo lo que este script sabe decir sobre
// "sin JS" depende de que `javaScriptEnabled: false` de Playwright de verdad
// apague la media feature `scripting` en Chromium — si no la apaga, la seccion
// 2 completa pasa sin comprobar nada, y un verde asi es peor que un rojo.
//
// La sonda es `.reveal`: con scripting, un `.reveal` que no ha entrado en vista
// calcula `opacity: 0` (la regla vive dentro de `@media (scripting: enabled)`,
// ver globals.css); sin scripting la regla no aplica y calcula `opacity: 1`. Se
// usa el mismo `.reveal`, localizado por indice, en los dos contextos.
{
  const ctxJs = await navegador.newContext()
  const pageJs = await ctxJs.newPage()
  await pageJs.setViewportSize({ width: 1440, height: 900 })
  await pageJs.goto(base + '/', { waitUntil: 'networkidle' })

  const candidato = await pageJs.evaluate(() => {
    const nodos = Array.from(document.querySelectorAll('.reveal'))
    // Bien debajo del pliegue: el rootMargin de useEnVista adelanta la deteccion
    // un 12% de la altura de la ventana, asi que un umbral de 1.5x la ventana
    // deja margen de sobra para que el observer no lo haya marcado visible.
    const idx = nodos.findIndex((el) => el.getBoundingClientRect().top > window.innerHeight * 1.5)
    if (idx === -1) return null
    return { idx, opacity: getComputedStyle(nodos[idx]).opacity, total: nodos.length }
  })
  await ctxJs.close()

  if (!candidato) {
    await abortar(
      '\nAUTOTEST DEL ARNES INCONCLUSO: no se encontro ningun .reveal suficientemente debajo\n' +
        'del pliegue en "/" para probar el mecanismo de ocultamiento sin JavaScript.\n' +
        'Esto no confirma ni descarta que "javaScriptEnabled: false" apague\n' +
        '@media (scripting: enabled): los resultados de la seccion "sin JavaScript" de este\n' +
        'script NO SON CONFIABLES sin este autotest.\n' +
        'Verificalo a mano: DevTools -> Settings -> Debugger -> Disable JavaScript, recargar\n' +
        '/colecciones y contar ocho cards.\n',
    )
  }

  if (candidato.opacity !== '0') {
    await abortar(
      `\nAUTOTEST DEL ARNES INCONCLUSO: con JavaScript activo, el .reveal #${candidato.idx}` +
        ` de ${candidato.total} (bien debajo del pliegue, sin haber hecho scroll) deberia` +
        ` calcular opacity 0 y calcula ${candidato.opacity}. La sonda misma no funciona como` +
        ' se espera, asi que no puede usarse para juzgar el contexto sin JavaScript.\n' +
        'Verificalo a mano: DevTools -> Settings -> Debugger -> Disable JavaScript, recargar\n' +
        '/colecciones y contar ocho cards.\n',
    )
  }

  const ctxNoJs = await navegador.newContext({ javaScriptEnabled: false })
  const pageNoJs = await ctxNoJs.newPage()
  await pageNoJs.setViewportSize({ width: 1440, height: 900 })
  await pageNoJs.goto(base + '/')
  const opacitySinJs = await pageNoJs.evaluate(
    (idx) => getComputedStyle(document.querySelectorAll('.reveal')[idx]).opacity,
    candidato.idx,
  )
  await ctxNoJs.close()

  if (opacitySinJs !== '1') {
    await abortar(
      `\nEL ARNES NO DISCRIMINA: con "javaScriptEnabled: false" el mismo .reveal #${candidato.idx}` +
        ` sigue en opacity ${opacitySinJs} en vez de 1. Eso quiere decir que` +
        ' @media (scripting: enabled) SIGUE activo sin JavaScript en este Chromium, y por lo' +
        ' tanto TODA la seccion "sin JavaScript" de este script pasa sin comprobar nada real.\n' +
        'NO le des credito a ningun resultado de esa seccion aunque salga en verde.\n' +
        'Verificalo a mano: DevTools -> Settings -> Debugger -> Disable JavaScript, recargar\n' +
        '/colecciones y contar ocho cards.\n',
    )
  }

  console.log('Autotest del arnes: "javaScriptEnabled: false" si apaga @media (scripting: enabled).')
}

// --- 1. Sin desborde horizontal, sin errores de consola, alt en toda imagen ---
{
  const ctx = await navegador.newContext()
  const page = await ctx.newPage()
  const errores = []
  page.on('console', (m) => m.type() === 'error' && errores.push(`${page.url()}: ${m.text()}`))
  page.on('pageerror', (e) => errores.push(`${page.url()}: ${e.message}`))

  for (const ruta of RUTAS) {
    for (const ancho of ANCHOS) {
      await page.setViewportSize({ width: ancho, height: 900 })
      const respuesta = await page.goto(base + ruta, { waitUntil: 'networkidle' })
      comprobar(respuesta?.status() === 200, `${ruta} devolvio ${respuesta?.status()}`)

      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      comprobar(desborde <= 1, `${ruta} @${ancho}px desborda ${desborde}px en horizontal`)
    }

    const sinAlt = await page.$$eval('img:not([alt])', (n) => n.length)
    comprobar(sinAlt === 0, `${ruta} tiene ${sinAlt} <img> sin alt`)

    const sinNombre = await page.$$eval(
      'button, a[href]',
      (nodos) =>
        nodos.filter(
          (n) =>
            !n.textContent.trim() &&
            !n.getAttribute('aria-label') &&
            !n.getAttribute('aria-labelledby'),
        ).length,
    )
    comprobar(sinNombre === 0, `${ruta} tiene ${sinNombre} controles sin nombre accesible`)

    // Solo los controles del sistema. Los enlaces de texto en linea quedan fuera
    // a proposito: WCAG 2.5.8 los exceptua y medirlos daria falsos rojos en la
    // miga de pan, en el pie y en el link de la guia de tallas.
    const chicos = await page.$$eval('.btn, .icon-btn, .swatch-hit, .size-btn, .punto', (nodos) =>
      nodos.filter((n) => {
        const r = n.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44)
      }).length,
    )
    comprobar(chicos === 0, `${ruta} tiene ${chicos} controles del sistema bajo 44x44`)
  }

  comprobar(errores.length === 0, `errores de consola:\n  ${errores.join('\n  ')}`)
  await ctx.close()
}

// --- 2. Las cards del export estatico: lo que Google indexa sin ejecutar nada ---
//
// Cuenta ocurrencias sobre el HTML crudo, no lineas: el export queda minificado
// en una sola linea por archivo, asi que `grep -c` siempre daria 1 sin importar
// cuantas cards haya. Esto prueba el HTML que sale de `next build`, antes de que
// Playwright o cualquier motor de layout toquen la pagina.
{
  const ESPERADAS = { colecciones: 8, leggings: 3, tops: 3, sets: 2 }
  for (const [ruta, esperadas] of Object.entries(ESPERADAS)) {
    const html = await readFile(join(RAIZ, `${ruta}.html`), 'utf8')
    const cards = html.match(/class="card"/g)?.length ?? 0
    comprobar(
      cards === esperadas,
      `out/${ruta}.html trae ${cards} ocurrencias de class="card", deberian ser ${esperadas}`,
    )
  }
}

// --- 3. Sin JavaScript: nada escondido, catalogo y ficha completos (SPEC §9.5) ---
{
  const ctx = await navegador.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()

  for (const ruta of RUTAS) {
    await page.goto(base + ruta)
    const invisibles = await page.$$eval(
      '.reveal',
      (n) => n.filter((el) => getComputedStyle(el).opacity !== '1').length,
    )
    comprobar(invisibles === 0, `${ruta} sin JS deja ${invisibles} bloques .reveal invisibles`)
  }

  await page.goto(base + '/colecciones')
  const cards = await page.$$eval('.card', (n) => n.length)
  comprobar(cards === 8, `/colecciones sin JS muestra ${cards} cards, deberian ser 8`)
  const cargarMas = await page.$$eval('.cargar-mas', (n) =>
    n.filter((el) => getComputedStyle(el).display !== 'none').length,
  )
  comprobar(cargarMas === 0, '/colecciones sin JS muestra el boton "Cargar mas", que no hace nada')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base + '/leggings/legging-duna')
  const fotos = await page.$$eval('.galeria-vista > li', (n) =>
    n.filter((el) => getComputedStyle(el).display !== 'none').length,
  )
  comprobar(fotos === 4, `la ficha sin JS muestra ${fotos} fotos de galeria, deberian ser 4`)

  const textoAcordeon = await page.textContent('body')
  comprobar(
    textoAcordeon.includes('Llega en 2 a 4 dias habiles'),
    'la ficha sin JS no trae el texto de los acordeones',
  )

  await ctx.close()
}

// --- 4. prefers-reduced-motion: nada invisible, el trazo aparece dibujado ---
//
// El trazo se dibuja con dos tecnicas distintas (ver el comentario de `.trazo
// path` en globals.css): TrazoCierre y TrazoPaso con `stroke-dashoffset`,
// TrazoColumna con `clip-path` porque el dasharray se pinta partido en un SVG
// estirado de forma no uniforme. Cada una necesita su propia comprobacion; la
// del dasharray sola pasaria trivialmente para la columna, que no tiene
// dasharray, sin verificar nada de su mecanismo real.
{
  const ctx = await navegador.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()

  for (const ruta of RUTAS) {
    await page.goto(base + ruta, { waitUntil: 'networkidle' })
    const invisibles = await page.$$eval(
      '.reveal',
      (n) => n.filter((el) => getComputedStyle(el).opacity !== '1').length,
    )
    comprobar(invisibles === 0, `${ruta} con reduced-motion deja ${invisibles} bloques invisibles`)

    const sinDibujar = await page.$$eval(
      '.trazo:not(.trazo-columna) path',
      (n) => n.filter((el) => getComputedStyle(el).strokeDashoffset !== '0px').length,
    )
    comprobar(sinDibujar === 0, `${ruta} con reduced-motion deja ${sinDibujar} trazos sin dibujar`)

    const columnasSinDibujar = await page.$$eval(
      '.trazo-columna',
      (n) => n.filter((el) => getComputedStyle(el).clipPath !== 'none').length,
    )
    comprobar(
      columnasSinDibujar === 0,
      `${ruta} con reduced-motion deja ${columnasSinDibujar} columnas de trazo sin dibujar`,
    )
  }

  await ctx.close()
}

// --- 5. Los filtros viven en la URL ---
{
  const ctx = await navegador.newContext()
  const page = await ctx.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  // Se espera al resultado en vez de medir justo despues de `networkidle`: entre
  // que la red calla y que React hidrata y reemplaza el fallback hay unos ms, y
  // medir ahi da un rojo intermitente que no significa nada.
  await page.goto(base + '/colecciones?color=Arena')
  try {
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 3, {
      timeout: 5000,
    })
  } catch {
    const cuantas = await page.$$eval('.card', (n) => n.length)
    comprobar(false, `/colecciones?color=Arena muestra ${cuantas} cards, deberian ser 3`)
  }

  await page.goto(base + '/colecciones?orden=precio-asc')
  try {
    await page.waitForFunction(
      () => document.querySelector('.card .card-name')?.textContent === 'Top Brisa',
      { timeout: 5000 },
    )
  } catch {
    const primera = await page.textContent('.card .card-name')
    comprobar(false, `?orden=precio-asc empieza por "${primera}", deberia ser "Top Brisa"`)
  }

  await ctx.close()
}

await navegador.close()
servidor.close()

if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s):`)
  for (const f of fallos) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('Todo en orden: sin desborde, sin JS completo, reduced-motion respetado, filtros en la URL.')
