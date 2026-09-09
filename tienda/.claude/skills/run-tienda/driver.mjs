#!/usr/bin/env node
// Driver de la tienda NUDE SPORTSWEAR.
// Maneja el dev server (o cualquier BASE) con Playwright headless.
//
//   node .claude/skills/run-tienda/driver.mjs smoke
//   node .claude/skills/run-tienda/driver.mjs shot /leggings/legging-duna ficha
//   node .claude/skills/run-tienda/driver.mjs eval / "document.title"
//
// SIEMPRE se corre con cwd = tienda/ — 'playwright' se resuelve desde
// tienda/node_modules, no desde donde vive este archivo.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS ?? '/tmp/tienda-shots';
const [cmd, ...args] = process.argv.slice(2);

mkdirSync(SHOTS, { recursive: true });

// Las rutas de ficha salen del catálogo, no de una lista quemada:
// cuando productos.json cambie (fase 2, Firestore) esto sigue siendo cierto.
async function fichas() {
  const raw = JSON.parse(await readFile('src/content/productos.json', 'utf8'));
  const arr = Array.isArray(raw) ? raw : raw.productos ?? Object.values(raw)[0];
  return arr.map((p) => `/${p.categoria}/${p.slug}`);
}

async function servidorVivo() {
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function abrir(ancho = 1440, alto = 900) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  page.on('console', (m) => m.type() === 'error' && errores.push(`[console] ${m.text()}`));
  page.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`));
  return { browser, page, errores };
}

// Obligatorio antes de cualquier screenshot: los bloques .reveal arrancan en
// opacity:0 y solo los enciende el IntersectionObserver. Un fullPage sin esto
// sale con franjas de color vacías que parecen bloques rotos y no lo están.
async function scrollTodo(page) {
  const alto = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < alto; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

// '/leggings/legging-duna' -> 'leggings_legging_duna'; '/' -> 'home'
function slug(ruta) {
  const base = ruta.replace(/\W+/g, '_').replace(/^_|_$/g, '');
  return base === '' ? 'home' : base;
}

async function ocultos(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.reveal')]
      .filter((el) => getComputedStyle(el).opacity !== '1')
      .map((el) => (el.textContent || '').trim().slice(0, 50) || el.className),
  );
}

async function cmdShot() {
  const [ruta = '/', nombre] = args;
  const archivo = `${SHOTS}/${nombre ?? slug(ruta)}.png`;
  const { browser, page, errores } = await abrir();
  await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
  await scrollTodo(page);
  await page.screenshot({ path: archivo, fullPage: true });
  console.log(archivo);
  if (errores.length) console.log(`errores de consola: ${errores.length}\n  ${errores.join('\n  ')}`);
  await browser.close();
}

async function cmdEval() {
  const [ruta = '/', js] = args;
  const { browser, page } = await abrir();
  await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
  await scrollTodo(page);
  console.log(JSON.stringify(await page.evaluate(js), null, 2));
  await browser.close();
}

async function cmdSmoke() {
  let fallas = 0;
  // afirmar(cond, mensajeSiPasa, mensajeSiFalla) — una sola forma de reportar,
  // y el exit code sale del contador.
  function afirmar(cond, ok, ko) {
    if (cond) {
      console.log(`  ✓ ${ok}`);
    } else {
      fallas++;
      console.log(`  ✗ ${ko}`);
    }
  }

  const catalogos = ['/', '/colecciones', '/leggings', '/tops', '/sets', '/sistema'];
  const listaFichas = await fichas();

  console.log('# HTTP');
  for (const r of [...catalogos, ...listaFichas]) {
    const c = (await fetch(BASE + r)).status;
    afirmar(c === 200, `200 ${r}`, `${c} ${r} (esperaba 200)`);
  }
  // 404 a propósito: rutas de menú fuera de alcance + slug inexistente
  for (const r of ['/nosotros', '/leggings/no-existe']) {
    const c = (await fetch(BASE + r)).status;
    afirmar(c === 404, `404 ${r} (esperado)`, `${c} ${r} (esperaba 404)`);
  }

  console.log('\n# HTML del servidor (el fallback sin JavaScript)');
  const html = await (await fetch(BASE + '/colecciones')).text();
  const enServidor = new Set(html.match(/href="\/(?:leggings|tops|sets)\/[a-z-]+"/g) ?? []);
  afirmar(
    enServidor.size === listaFichas.length,
    `/colecciones trae ${enServidor.size}/${listaFichas.length} productos sin hidratar`,
    `/colecciones trae ${enServidor.size} de ${listaFichas.length} productos en el HTML crudo`,
  );

  console.log('\n# Navegador');
  const { browser, page, errores } = await abrir();
  for (const r of ['/', '/colecciones', listaFichas[0]]) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    await scrollTodo(page);
    const [sw, vw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    afirmar(sw <= vw, `sin desborde en ${r} @1440`, `desborde horizontal en ${r}: ${sw} > ${vw}`);
    const inv = await ocultos(page);
    afirmar(
      inv.length === 0,
      `.reveal todos visibles en ${r}`,
      `${inv.length} .reveal invisibles tras scroll en ${r}: ${inv.join(' | ')}`,
    );
    await page.screenshot({ path: `${SHOTS}/${slug(r)}.png`, fullPage: true });
  }

  // El filtrado es client-side (export estático: no hay searchParams en servidor)
  const cuenta = () => page.evaluate(() =>
    new Set([...document.querySelectorAll('a[href^="/leggings/"],a[href^="/tops/"],a[href^="/sets/"]')]
      .map((a) => a.getAttribute('href'))).size);
  await page.goto(BASE + '/colecciones', { waitUntil: 'networkidle' });
  const antes = await cuenta();
  await page.goto(BASE + '/colecciones?color=Arena', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const despues = await cuenta();
  afirmar(
    despues < antes,
    `?color=Arena filtra en cliente: ${antes} → ${despues}`,
    `?color=Arena no filtró (${antes} → ${despues})`,
  );

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await scrollTodo(page);
  const swM = await page.evaluate(() => document.documentElement.scrollWidth);
  afirmar(swM <= 375, 'sin desborde en / @375', `desborde en móvil: ${swM} > 375`);
  await page.screenshot({ path: `${SHOTS}/home-movil.png`, fullPage: true });

  afirmar(
    errores.length === 0,
    '0 errores de consola',
    `${errores.length} errores de consola:\n    ${errores.slice(0, 10).join('\n    ')}`,
  );
  await browser.close();

  console.log(`\nscreenshots en ${SHOTS}`);
  console.log(fallas ? `\n✗ ${fallas} fallas` : '\n✓ todo en orden');
  process.exit(fallas ? 1 : 0);
}

if (!(await servidorVivo())) {
  console.error(`No hay nada en ${BASE}. Levantá el dev server primero:\n  npm run dev`);
  process.exit(2);
}

const comandos = { smoke: cmdSmoke, shot: cmdShot, eval: cmdEval };
if (!comandos[cmd]) {
  console.error('uso: driver.mjs smoke | shot <ruta> [nombre] | eval <ruta> <js>');
  process.exit(2);
}
await comandos[cmd]();
