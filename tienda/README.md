# Tienda NUDE SPORTSWEAR

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Firestore.
Especificación: [`../SPEC.md`](../SPEC.md). Este README documenta el estado real del código.

```bash
npm run dev            # dev en http://localhost:3000
npm run dev -- -p 4310 # otro puerto si 3000 está ocupado
npm run build          # build de producción
npm run lint           # ESLint (debe salir limpio)
node scripts/gen-logos.mjs  # regenera los componentes del logo desde los SVG oficiales
```

Para revisar en el celular: `npm run dev` y abrir `http://<tu-ip>:3000`.
Los rangos de red local ya están en `allowedDevOrigins` (`next.config.ts`) — sin eso Next 16
bloquea los recursos de desarrollo, la página carga pero nada responde.

---

## Estado: fase 3 completa (§9.4) sobre catálogo mock

**Entregado:** design system (fase 1) + home completa, catálogo y ficha de producto.

| Ruta | Qué es |
|------|--------|
| `/` | Home completa, diez bloques del SPEC §4.1 |
| `/leggings` · `/tops` · `/sets` | Catálogo por categoría con filtros en la URL |
| `/colecciones` | Todo el catálogo. Destino de "Ver todo" |
| `/[categoria]/[slug]` | Ficha de producto. Ocho fichas prerenderizadas |
| `/sistema` | Verificación del design system. `noindex`, no enlazada |
| 404 | Isotipo + "Esta página se movió." |

**El catálogo es un mock.** `src/content/productos.json` tiene ocho referencias
inventadas y todas las fotos de producto son placeholders planos. Nada de eso pasa
por Firestore todavía: la fase 2 cambia el cuerpo de las cuatro funciones de
`src/lib/productos.ts` y ningún componente se toca.

**Pendiente:** modelo de datos y panel (2) · carrito y checkout (4) · panel de
pedidos y correos (5) · Nosotras y páginas de contenido (6).

---

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

`npm run verificar` corre contra `out/`, no contra el dev server, porque `out/` es
lo que Firebase publica. Comprueba, en `/`, los cuatro catálogos, tres fichas y
`/sistema`, a 375, 768, 1024 y 1440px:

- Sin desborde horizontal, sin errores de consola, `alt` en toda imagen, nombre
  accesible en todo control y área táctil de 44px
- Sin JavaScript: cero bloques `.reveal` invisibles, las ocho cards en
  `/colecciones` y las cuatro fotos de galería en la ficha
- `prefers-reduced-motion`: nada invisible y el trazo dibujado
- Los filtros viven en la URL: `?color=Arena` y `?orden=precio-asc` llegan
  aplicados en carga fría

Antes de creer cualquiera de esos resultados de "sin JavaScript", el script se
autoprueba: comprueba que `javaScriptEnabled: false` de Playwright de verdad
apaga `@media (scripting: enabled)` en Chromium, usando un `.reveal` fuera de
vista como sonda. Si esa autoprueba fallara, el script aborta con un mensaje
explicando que la sección "sin JavaScript" no es confiable y cómo comprobarlo a
mano (DevTools → Settings → Debugger → Disable JavaScript).

Fuera del script y a mano: contraste del texto sobre fotografía, encuadre de los
recortes y tono del copy.

Escribir el script encontró dos fallas reales, ya corregidas: `@media (prefers-reduced-motion: reduce)`
perdía la guerra de especificidad CSS contra `.trazo[data-drawn="true"]` (visualmente
casi idéntico, pero no era el "sin animación" que promete el SPEC — se corrigió con
`!important`, ver el comentario junto a esa regla en `globals.css`); y el header, el
footer, el nav móvil y la barra de anuncio precargaban con `next/link` rutas de menú
que hoy caen en 404 a propósito, lo que llenaba la consola de errores en cada carga —
ver `prefetchable()` en `src/lib/site.ts`.

---

## Despliegue

**En vivo en https://nudesportswear.co** desde el 2 de septiembre de 2026, por decisión
explícita de Daniela — sabiendo que la tienda está en fase 1 y no puede vender.

```bash
npm run build                    # escribe out/ (export estatico)
firebase deploy --only hosting   # publica out/ en el dominio

# revisar antes de publicar, sin tocar el dominio:
firebase hosting:channel:deploy pre-ecom --expires 2d
```

**⚠️ Este sitio y la landing comparten el mismo sitio de Firebase (`nudesportswear-landing`).**
La landing vive en **otro repo** — el de marca, en
`~/Documents/Claude/Projects/NUDE SPORTWEAR/landing/landing-page/` — y apunta al mismo
proyecto de Firebase. Un `firebase deploy` corrido desde allá **reemplaza el ecom por la
landing sin avisar**, y al revés. El último que despliega gana. Como ahora son dos repos
distintos, git no te va a avisar de nada: antes de desplegar cualquiera de los dos, confirmá
desde qué carpeta estás corriendo el comando.

**Rollback a la landing:**

```bash
cd ~/Documents/Claude/Projects/NUDE\ SPORTWEAR/landing/landing-page
firebase deploy --only hosting
```

También sirve revertir el release desde la consola de Firebase (Hosting → historial de versiones),
que no depende de tener el otro repo a mano.

**El export estático sigue en pie, y no por casualidad.** Catálogo y ficha son
rutas dinámicas prerenderizadas con `generateStaticParams` sobre el mock: las
cuatro páginas de catálogo y las ocho fichas salen en HTML. Lo que sí lo va a
tumbar es la fase 2 (Firestore en tiempo de petición) y la fase 4 (checkout con
Server Actions). Antes de esas hay que migrar a **Firebase App Hosting**.

Consecuencia hoy: **los filtros del catálogo se aplican en cliente**, no en
servidor, porque `searchParams` no existe en una página exportada. El HTML trae el
catálogo completo y el cliente lo filtra encima.

**`robots: { index: false }`** está en el layout raíz. Como el dominio ahora sirve esta app,
**todo `nudesportswear.co` está en `noindex, nofollow`** — la landing anterior sí era
indexable. Se deja así a propósito: es preferible que Google no indexe una tienda cuyo menú
cae en 404. Quitarlo cuando el catálogo esté publicado (fase 3+).

**Rutas del menú todavía en 404:** `/ropa-deportiva`, `/nosotros`, `/contacto`,
`/guia-de-tallas`, `/envios`, `/cambios`, `/legales`, `/cuenta` y `/buscar`. Fuera de
alcance de esta fase (spec de diseño §8). `prefetchable()` en `src/lib/site.ts` apaga
la precarga de `next/link` sobre esta misma lista — sin eso, Next intenta precargar
cada una apenas entra en el viewport y llena la consola de 404, cosa que el propio
`npm run verificar` detectó al comprobar errores de consola. Cuando una ruta se
construya, sale de esa lista y no hay que tocar nada más.

**Placeholders en `src/lib/site.ts`:** el WhatsApp es `+57 300 000 0000`, el mismo del linktree.

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
