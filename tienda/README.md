# Tienda NUDE SPORTSWEAR

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Postgres (Drizzle) + Better Auth.
Especificación: [`../SPEC.md`](../SPEC.md). Este README documenta el estado real del código.

```bash
cp .env.example .env.local   # una vez
npm run db:up          # Postgres 17 local en :5435
npm run fotos:subir    # una vez: catálogo inicial al almacén (R2 o .almacen/ en local)
npm run dev            # dev en http://localhost:3000 (migra solo)
npm run dev -- -p 4310 # otro puerto si 3000 está ocupado
npm run build          # build de producción
npm run lint           # ESLint (debe salir limpio)
npm run typecheck      # tsc
npm test               # vitest contra <base>_test (se crea, migra y siembra sola)
node scripts/gen-logos.mjs  # regenera los componentes del logo desde los SVG oficiales
```

Para revisar en el celular: `npm run dev` y abrir `http://<tu-ip>:3000`.
Los rangos de red local ya están en `allowedDevOrigins` (`next.config.ts`) — sin eso Next 16
bloquea los recursos de desarrollo, la página carga pero nada responde.

---

## Estado: tienda completa con catálogo real (fases 2, 3 y 4 del SPEC §9.4)

| Ruta | Qué es |
|------|--------|
| `/` | Home: hero, manifiesto, tiles de Enterizos/Sets/Leggings, línea con todas las categorías, destacados |
| `/[categoria]` | Catálogo por categoría (`/enterizos`, `/sets`, `/leggings`, `/tops`, `/bodys`, `/shorts-y-faldas`, `/accesorios`, `/bienestar`). Las categorías viven en Postgres |
| `/colecciones` | Todo el catálogo publicado |
| `/[categoria]/[slug]` | Ficha: precio por color, talla única preseleccionada, colores sin foto con marcador |
| `/checkout` · `/pedido/[id]` | Checkout de una página (contra entrega o transferencia, envío por ciudad, código de descuento) y confirmación con WhatsApp |
| `/envios` `/cambios` `/contacto` `/guia-de-tallas` `/nosotros` | Contenido, con copy ya aprobado |
| `/admin` | Panel: productos (fotos, colores, tallas, disponibilidad), categorías, pedidos, configuración |
| `/fotos/p/<nombre>-<ancho>.<ext>` | Fotos del catálogo inicial, leídas de R2 (prefijo `fotos/p/`) |
| `/media/<id>-<ancho>.<ext>` | Fotos subidas desde el panel, leídas de R2 (prefijo `media/`) |
| `/api/health` · `/api/health/db` | Liveness (no toca la base) y readiness (base migrada) para Coolify y el smoke de CI |

**No se maneja inventario.** Una variante (color × talla) está disponible o no, y eso se
marca en el panel. No hay números de stock en ningún lado.

**El catálogo es real.** Sale de `Productos_20261005_1445.xlsx` (78 filas, una por color) y
de la sesión de fotos (`catalogonude-20261005T194331Z-1-001.zip`), vía
`scripts/importar-catalogo.py` → `src/content/productos.json` + `scripts/catalogo-fotos.json`
→ `scripts/gen-catalogo.mjs` → `semilla/fotos/p/` → `npm run fotos:subir` → R2. Quedó en 46 productos: 32 publicados (109
fotos) y 14 en **borrador** porque no tienen foto todavía. Un borrador existe en el panel y
no en la tienda; se publica subiéndole una foto. Reglas de la agrupación en el docstring de
`scripts/importar-catalogo.py`.

**Panel en local** (Google OAuth no sirve sin credenciales):

```bash
node scripts/sesion-admin-dev.mjs   # imprime la cookie better-auth.session_token de una admin de prueba
```

## Estructura

```
src/
├── app/
│   ├── layout.tsx              raíz: fuentes, metadata, viewport
│   ├── globals.css             TODO el design system (tokens + componentes)
│   ├── icon.svg                favicon: isotipo Umber sobre Cream
│   ├── not-found.tsx           404
│   └── (tienda)/               grupo de rutas con header + footer
│       ├── layout.tsx
│       ├── page.tsx            home (cáscara fase 1)
│       └── sistema/            página de verificación
├── components/
│   ├── brand/                  Isotipo.tsx y Wordmark.tsx GENERADOS + Logo.tsx
│   ├── layout/                 Header, Footer, NavMovil, BotonCarrito
│   ├── motion/                 Reveal, Trazo, useEnVista
│   └── ui/                     Button, Field, Selectores, Acordeon, Panel, icons
├── lib/                        fonts, site, copy, format
└── scripts/gen-logos.mjs       SVG oficiales → componentes React
```

El checkout irá en su propio grupo de rutas, fuera de `(tienda)`: ahí el header pierde la
navegación y queda solo el logo (SPEC §4.5). Por eso Header y Footer no viven en el layout raíz.

---

## Reglas del sistema

**Los tokens son la única fuente de color.** `globals.css` borra las paletas por defecto de
Tailwind: `bg-slate-500` **no compila**, y `shadow-md` tampoco (SPEC §2.4: sin sombras).
Si un utility de color falla, el sistema está funcionando — hay que usar `bg-cream`,
`text-muted`, `border-line-soft`.

**Superficies, no clases de fondo.** Un bloque oscuro usa `.on-dark`, uno Sahara usa
`.on-sahara`. Esas clases redefinen `--text-muted` al valor que sí pasa contraste en ese
fondo. Poner `bg-sahara` a mano se salta la corrección y deja texto ilegible.

**Los logos no se recrean con fuentes.** `Isotipo.tsx` y `Wordmark.tsx` son generados; se
editan corriendo `scripts/gen-logos.mjs`, no a mano. Viven en `currentColor`, así que un
solo archivo sirve para cualquier color de la paleta.

**Nada se esconde sin JavaScript.** Todas las reglas que ponen `opacity: 0` viven dentro de
`@media (scripting: enabled)`. Se verifica desactivando JS: nada desaparece (SPEC §9.5).

**Ningún componente importa `productos.json`.** Todo pasa por `src/lib/productos.ts`,
y sus cuatro funciones son `async` desde hoy aunque lean un archivo síncrono. Es lo
que hace que la fase 2 sea cambiar un cuerpo de función en vez de cada página.

**El filtrado es mejora progresiva.** El servidor renderiza la grilla entera —de ahí
sale el SEO— y el cliente la reemplaza ya filtrada. El fallback del `<Suspense>` es
esa misma grilla completa, así que sin JavaScript queda el catálogo entero.

**Server Components por defecto.** Solo llevan `'use client'`: `NavMovil`, `BotonCarrito`,
`Panel`, `Acordeon`, `Reveal`, `Trazo` y las demos de `/sistema`.

---

## Dos correcciones al SPEC

Ambas son fallas de contraste del propio SPEC, encontradas al implementarlo.
Están comentadas en `globals.css` donde aplican.

**1. `--text-muted` sobre Sahara: 4.10:1 — no pasa AA.**
La tabla de §2.1 verifica `--text-muted` contra Cream (4.93:1) pero no contra Sahara.
En Sahara el texto secundario vuelve a Umber pleno (6.88:1), vía `.on-sahara`.

**2. Placeholder en Dune sobre White: 1.87:1 — ilegible.**
§5 pide "Placeholder en Dune"; §12 marca el contraste como crítico y gana. El placeholder
usa `--text-muted` (5.58:1) y se distingue del valor real por peso (200 vs 300), no por
color. La etiqueta siempre está visible, así que el placeholder nunca hace de etiqueta.

---

## Decisiones técnicas que se salen del SPEC

| SPEC | Qué se hizo | Por qué |
|------|-------------|---------|
| §9.5: clase en `<html>` puesta por script para el estado oculto | `@media (scripting: enabled)` | Es la misma condición evaluada por CSS. Un script menos y nada que hidratar mal |
| §9.6: `import { X } from '@phosphor-icons/react'` | `@phosphor-icons/react/dist/ssr` reexportado desde `components/ui/icons.tsx` | La versión CSR arrastra contexto de React; la SSR son SVG planos que sirven en Server y Client. Un solo punto de entrada mantiene el set cerrado |
| §11.1: dibujar el trazo con `stroke-dashoffset` | igual, pero con `pathLength="1"` | Normaliza la longitud del path: no hay que medirlo con JavaScript |
| §11.1: `TrazoColumna` (la columna vertical de catálogo y ficha) también con `stroke-dashoffset` | se dibuja con `clip-path` en su lugar | Bug de rasterizado de Chrome: el dasharray normalizado se pinta partido en pedazos sobre un SVG estirado de forma no uniforme (`alto="100%"`). Detalle completo en el comentario de `.trazo path` en `globals.css` |
| §5: acordeón | contenido siempre en el DOM, colapsado con `grid-template-rows: 0fr→1fr` | Google lo indexa aunque esté cerrado, y anima a altura automática sin medir |

---

## Verificado

```bash
npm test          # vitest: adaptador de producto y filtros
npm run verificar # build + Playwright sobre out/ en Chrome real
```

**`npm run verificar` queda temporalmente sin vigencia.** Corría Playwright contra
`out/`, el export estático que este trabajo elimina. Adaptarlo para correr contra
`next start` (o borrarlo) es un pendiente aparte — no está en el alcance de este
plan. Mientras tanto, la verificación visual pasa por `run-tienda`
(`.claude/skills/run-tienda/`) contra el dev server.

**Cómo funcionaba antes de quedar sin vigencia:** el script corría contra `out/`,
no contra el dev server, porque `out/` era lo que Firebase publicaba. Comprobaba,
en `/`, los cuatro catálogos, tres fichas y `/sistema`, a 375, 768, 1024 y 1440px:

- Sin desborde horizontal, sin errores de consola, `alt` en toda imagen, nombre
  accesible en todo control y área táctil de 44px
- Sin JavaScript: cero bloques `.reveal` invisibles, las ocho cards en
  `/colecciones` y las cuatro fotos de galería en la ficha
- `prefers-reduced-motion`: nada invisible y el trazo dibujado
- Los filtros viven en la URL: `?color=Arena` y `?orden=precio-asc` llegan
  aplicados en carga fría

Antes de creer cualquiera de esos resultados de "sin JavaScript", el script se
autoprobaba: comprobaba que `javaScriptEnabled: false` de Playwright de verdad
apagara `@media (scripting: enabled)` en Chromium, usando un `.reveal` fuera de
vista como sonda. Si esa autoprueba fallaba, el script abortaba con un mensaje
explicando que la sección "sin JavaScript" no era confiable y cómo comprobarlo a
mano (DevTools → Settings → Debugger → Disable JavaScript).

Fuera del script y a mano (esto sigue vigente): contraste del texto sobre
fotografía, encuadre de los recortes y tono del copy.

Escribir el script encontró en su momento dos fallas reales, ya corregidas: `@media (prefers-reduced-motion: reduce)`
perdía la guerra de especificidad CSS contra `.trazo[data-drawn="true"]` (visualmente
casi idéntico, pero no era el "sin animación" que promete el SPEC — se corrigió con
`!important`, ver el comentario junto a esa regla en `globals.css`); y el header, el
footer, el nav móvil y la barra de anuncio precargaban con `next/link` rutas de menú
que hoy caen en 404 a propósito, lo que llenaba la consola de errores en cada carga —
ver `prefetchable()` en `src/lib/site.ts`.

---

## Despliegue

Sigue la arquitectura de referencia de
[`starter-next-auth`](https://github.com/juancadavidc/starter-next-auth): GitHub Actions →
GHCR → Coolify, con los workflows comunes de
[`shared-gha-stackless`](https://github.com/juancadavidc/shared-gha-stackless) (`@v1`). La
diferencia es de forma, no de modelo: aquí la app es un solo paquete npm en `tienda/`, no un
monorepo pnpm, y los workflows (en `../.github/workflows/`) se lo dicen con
`working-directory`/`context: tienda`.

| Workflow | Cuándo | Qué hace |
|----------|--------|----------|
| `ci.yml` | cada PR | lint, tipos, migraciones solo aditivas, migrate y tests contra Postgres efímero + smoke de la imagen |
| `staging.yml` | merge a `main` | lo mismo → `ghcr.io/juancadavidc/ecom-nude/tienda:staging` y `:<sha>` → redeploy de **staging** |
| `release.yml` | pre-release `vX.Y.Z-rc.N` | lo mismo sobre ese commit → `:vX.Y.Z` y `:latest` → release final → redeploy de **producción** y health check |

`latest` es solo de producción y solo lo mueve un release. Coolify no construye nada: cada
ambiente es una app "Docker Image" con las variables de `docker-compose.yaml` (staging con
`TAG=staging`, producción con `TAG=latest`), **cada una con su base y su bucket de R2**.

```bash
gh secret set COOLIFY_TOKEN
gh secret set COOLIFY_WEBHOOK_URL                            # webhook de staging
gh secret set COOLIFY_PROD_WEBHOOK_URL --env production      # webhook de producción
gh variable set STAGING_URL --body https://staging.nudesportswear.co
gh variable set PRODUCTION_URL --body https://nudesportswear.co
gh release create v1.0.0-rc.1 --prerelease --target main --generate-notes   # a producción
```

El paquete de GHCR nace privado: hacerlo público (GitHub → Packages → Settings) o darle
credenciales de GHCR a Coolify. El corte de DNS de `nudesportswear.co` desde Firebase hacia
Coolify sigue pendiente.

**La imagen** (`docker/Dockerfile`): Node 24 slim, `output: 'standalone'`, usuario no-root.
`docker/entrypoint.ts` (empaquetado con esbuild) aplica las migraciones con
`pg_advisory_lock` y después levanta `server.js`; si migrar falla, el contenedor no
arranca. `SKIP_MIGRATIONS=1` permite entrar a mirar sin tocar la base. `next build` nunca
toca Postgres: la tienda es `force-dynamic` (ver `app/(tienda)/layout.tsx`).

```bash
docker build -f docker/Dockerfile -t tienda .   # la misma imagen que corre en Coolify
```

**Migraciones:** automáticas en `npm run dev` (`src/instrumentation.ts`) y en el
entrypoint del contenedor. Nunca se edita ni se borra un `.sql` de `drizzle/`: se agrega
otro. Un `DROP`/`RENAME`/cambio de tipo nuevo necesita `-- allow-destructive: <motivo>`;
`npm run check-migrations` (corre en CI) lo exige.

**Variables de entorno** (`docker-compose.yaml` falla el deploy si falta una obligatoria):

| Variable | Obligatoria | Nota |
|---|---|---|
| `DATABASE_URL` | Sí | Postgres accesible desde el contenedor — nunca `localhost:5435` en producción |
| `BETTER_AUTH_SECRET` | Sí | 32+ caracteres, alta entropía |
| `BETTER_AUTH_URL` | Sí | El origen público https del sitio |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Sí | En producción, sin ellas el servidor no arranca |
| `ADMIN_EMAILS` | No | Correos separados por coma que nacen admin. Antes se llamaba `ADMIN_ALLOWLIST`; ese nombre se sigue leyendo |
| `R2_ACCOUNT_ID` · `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` · `R2_BUCKET_NAME` | Sí | Fotos de producto. Token de R2 con permiso de lectura y escritura sobre el bucket del ambiente |

**Fotos en R2.** Todas las fotos de producto viven en el bucket del ambiente, y la app las
sirve con caché inmutable de un año (`src/lib/almacen/`): el catálogo inicial bajo `fotos/p/`
y las del panel bajo `media/`. Las fotos de sitio (home, comunidad, placeholder) sí siguen
estáticas en `public/fotos`: son diseño, no catálogo. Sin `R2_ACCOUNT_ID`, en desarrollo y en
los tests el almacén es el directorio `.almacen/`; en producción R2 es obligatorio.

**Primer despliegue de cada ambiente**, una sola vez y en este orden:

```bash
# 1. Desde tu máquina, con las R2_* del ambiente en el entorno: catálogo inicial al bucket
R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET_NAME=… npm run fotos:subir
# 2. Dentro del contenedor (terminal de Coolify): catálogo inicial a la base
SEMBRAR_CATALOGO=si node seed.mjs
# 3. Solo si esa base ya tenía fotos subidas desde el panel antes de R2 (tabla `medios`)
node medios-a-r2.mjs
```

La semilla reemplaza todo el catálogo, por eso en producción se niega a correr sin
`SEMBRAR_CATALOGO=si`. La tabla `medios` queda como legado hasta que todos los ambientes
corran el paso 3; después se retira con una migración `-- allow-destructive`.

**`robots: { index: false }`** está en el layout raíz. Como el dominio ahora sirve esta app,
**todo `nudesportswear.co` está en `noindex, nofollow`** — la landing anterior sí era
indexable. Se deja así a propósito: es preferible que Google no indexe una tienda cuyo menú
cae en 404. Quitarlo cuando el catálogo esté publicado (fase 3+).

**Rutas todavía en 404:** solo `/legales` (términos y tratamiento de datos: necesita texto
legal real, no se inventa). El resto del texto viejo de abajo es historia:
`/ropa-deportiva`, `/nosotros`, `/contacto`,
`/guia-de-tallas`, `/envios`, `/cambios`, `/legales`, `/cuenta` y `/buscar`. Fuera de
alcance de esta fase (spec de diseño §8). `prefetchable()` en `src/lib/site.ts` apaga
la precarga de `next/link` sobre esta misma lista — sin eso, Next intenta precargar
cada una apenas entra en el viewport y llena la consola de 404, cosa que el propio
`npm run verificar` detectó al comprobar errores de consola. Cuando una ruta se
construya, sale de esa lista y no hay que tocar nada más.

**WhatsApp, cuentas bancarias, tarifas y códigos de descuento** se cambian en
`/admin/configuracion` (tabla `config`, ver `src/lib/config.ts`). Hasta que alguien los
cargue, el WhatsApp es el placeholder `573000000000`, no hay cuentas para transferencia (la
confirmación dice que se envían por WhatsApp) y `SECONDSKIN` da 10 % (supuesto, el SPEC no
fija el porcentaje).

**El correo del newsletter no se guarda.** `src/components/home/Newsletter.tsx`
valida y confirma, pero no escribe en ningún lado (`TODO(fase-6)`). Conectarlo
antes de quitar el `noindex`.

**Las medidas de la guía de tallas son provisionales** (`src/lib/tallas.ts`,
`TODO(decision-abierta-1)`). Las confirma el proveedor; publicar medidas
equivocadas sube las devoluciones, que es justo lo que la guía existe para bajar.

**La confiabilidad de `useEnVista` queda como pregunta abierta, no como bug confirmado.**
Dos investigaciones separadas no lograron determinar si su `IntersectionObserver`
siempre dispara `data-drawn`/`data-visible`, o si las fallas que se vieron eran
artefactos del scroll automatizado con el que se probó. Si la fragilidad es real,
un trazo o un `.reveal` podría, en un caso raro, no llegar a aparecer nunca. No se
reprodujo de forma confiable como para convertirlo en una corrección.

**`npm audit`** reporta vulnerabilidades altas en `brace-expansion`, `minimatch` y `postcss`,
todas transitivas de ESLint y de herramientas de build. No llegan al bundle del navegador.
`audit fix --force` bajaría ESLint a la v4 y rompería la configuración.
