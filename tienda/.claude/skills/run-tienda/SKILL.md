---
name: run-tienda
description: Levanta, maneja y prueba la tienda NUDE SPORTSWEAR (Next.js 16). Úsalo cuando pidan correr o arrancar la tienda, ver el dev server, tomar screenshots de la UI, navegar el catálogo o la ficha de producto, probar filtros, o verificar que un cambio de UI quedó bien.
---

Tienda Next.js 16 (App Router + Turbopack), export estático. Se maneja con
`.claude/skills/run-tienda/driver.mjs`, un driver de Playwright headless que hace
scroll, captura y afirma sobre la página real. No hay `chromium-cli` en esta máquina;
el driver es el arnés.

**Todas las rutas de acá son relativas a `tienda/`**, no a la raíz del repo.

## Prerequisitos

macOS con Node 22 (verificado en `v22.22.2`, npm 10.9.7). Sin paquetes de sistema:
Playwright headless corre sin xvfb ni libs extra.

## Setup

```bash
cd tienda            # NO desde la raíz del repo — ver Trampas
npm install
npx playwright install chromium
```

`npx playwright install chromium` no es opcional aunque `~/Library/Caches/ms-playwright`
ya tenga builds: Playwright 1.63 exige exactamente el build `1243` y falla si solo hay
otros. Es rápido (~94 MiB) e idempotente.

## Correr y manejar (camino del agente)

El driver necesita el server arriba; si no lo está, sale con código 2 y te lo dice.

```bash
npm run dev                       # deja corriendo en http://localhost:3000
node .claude/skills/run-tienda/driver.mjs smoke
```

`smoke` es la pasada completa y sale distinto de cero si algo falla. Comprueba, contra
el server vivo:

- HTTP 200 en home, `/colecciones`, las tres categorías, `/sistema` y **cada ficha del
  catálogo** (las saca de `src/content/productos.json`, no de una lista quemada — sigue
  siendo cierto cuando el catálogo cambie)
- HTTP 404 donde debe haberlo: `/nosotros` y un slug inexistente
- Que el HTML **sin hidratar** de `/colecciones` traiga los 8 productos (es el fallback
  sin JavaScript y de ahí sale el SEO)
- Sin desborde horizontal a 1440 y a 375px
- Que ningún bloque `.reveal` quede invisible tras scrollear
- Que `?color=Arena` filtre en cliente
- Cero errores de consola

Los otros dos comandos:

```bash
# screenshot fullPage, con el scroll previo que enciende los .reveal
node .claude/skills/run-tienda/driver.mjs shot /leggings/legging-duna ficha

# JS arbitrario dentro de la página, para afirmar sobre el DOM real
node .claude/skills/run-tienda/driver.mjs eval /colecciones \
  "[...document.querySelectorAll('button,a[href]')].map(e=>e.textContent.trim()).filter(t=>/cargar|ver/i.test(t))"
```

Los screenshots caen en `/tmp/tienda-shots` (cambiable con `SHOTS=...`). Contra otro
puerto o el build estático servido aparte: `BASE=http://localhost:4310 node ... smoke`.

**Mirá el screenshot.** Es la mitad del punto de tomarlo.

## Correr (camino humano)

`npm run dev` y abrir `http://localhost:3000`. Desde el celular, la IP local de la Mac:
los rangos ya están en `allowedDevOrigins` de `next.config.ts`.

## Probar

```bash
npm test          # vitest: 34 tests (adaptador de producto + filtros), ~200ms
npm run lint      # ESLint — debe salir sin una sola línea
npm run verificar # build + Playwright sobre out/ — el arnés propio del repo
```

`npm run verificar` es la verificación oficial del proyecto y corre sobre `out/`, no
sobre el dev server, porque `out/` es lo que Firebase publica. Toma ~1 min. Cubre cosas
que el driver no: sin JavaScript de verdad, `prefers-reduced-motion`, área táctil de
44px, `alt` en toda imagen. **No lo reemplaces con `driver.mjs smoke`** — el driver es
para el ciclo rápido contra el dev server; `verificar` es la puerta antes de desplegar.

## Trampas

**El screenshot fullPage sale con franjas de color vacías si no scrolleás primero.**
Los bloques `.reveal` (13 en la home) arrancan en `opacity: 0` y solo los enciende el
`IntersectionObserver`; `page.screenshot({ fullPage: true })` **no** dispara scroll, así
que captura la página con medio contenido invisible. El resultado parece un layout roto
—un bloque café enorme y otro beige— y no lo está. `scrollTodo()` en el driver existe
por esto; si escribís Playwright a mano, scrolleá antes de capturar.

**`npm install` va en `tienda/`, no en la raíz del repo.** Hay dos `package-lock.json`
y Next elige el de la raíz como workspace root, con un warning en cada arranque. El
warning es inofensivo; instalar en el lugar equivocado no.

**El driver se corre con cwd = `tienda/`.** Importa `playwright` desde
`tienda/node_modules`. Lanzarlo desde otra carpeta —aunque le des la ruta completa—
muere con `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`.

**`/colecciones` muestra 6 de 8 productos.** Es la paginación (botón `CARGAR MAS`), no
un filtro pegado ni datos faltantes. El HTML del servidor sí trae los 8.

**Los 404 del menú son a propósito.** `/ropa-deportiva`, `/nosotros`, `/contacto`,
`/guia-de-tallas`, `/envios`, `/cambios`, `/legales`, `/cuenta` y `/buscar` no existen
todavía. Clickear el header y caer en 404 es el comportamiento esperado, no una
regresión.

**Las fotos de producto son placeholders planos con el isotipo.** El catálogo es un mock
(`src/content/productos.json`, 8 referencias inventadas). Las fotos reales sí aparecen en
el hero, los tiles de categoría y la grilla de Instagram. Un beige liso con una `N` no es
una imagen rota.

**Los filtros se aplican en cliente.** Con export estático no hay `searchParams` en
servidor, así que `curl 'localhost:3000/leggings?color=Arena'` devuelve el catálogo
entero. Para afirmar sobre un filtro hay que pasar por el navegador — `driver.mjs eval`.

## Cuando algo falla

| Síntoma | Arreglo |
|---|---|
| `browserType.launch: Executable doesn't exist at .../chromium_headless_shell-1243/` | `npx playwright install chromium` |
| `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` | Correr el driver con `cwd = tienda/` |
| `No hay nada en http://localhost:3000` (exit 2) | El dev server no está arriba: `npm run dev` |
| Screenshot con bandas de color vacías | Falta scrollear antes de capturar (ver Trampas) |
| Warning de "multiple lockfiles" al arrancar | Inofensivo. Next eligió la raíz del repo como workspace root |
