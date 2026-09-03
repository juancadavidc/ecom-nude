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

## Estado: fase 1 completa (§9.4)

**Entregado:** design system — tokens, tipografía, botones, formularios, header y footer.

| Ruta | Qué es |
|------|--------|
| `/` | Cáscara de la home. Hero, manifiesto, tres pilares, franja de confianza. Existe para ver el sistema en contexto, **no es la home definitiva** (fase 6) |
| `/sistema` | **Página de verificación del design system.** Todo token y todo componente en un scroll. `noindex`, no enlazada desde la tienda |
| 404 | Isotipo + "Esta página se movió." + botón al catálogo |

**Pendiente de fases siguientes:** modelo de datos y panel (2) · catálogo y ficha (3) ·
carrito y checkout (4) · panel de pedidos y correos (5) · home real, Nosotras, contenido, SEO (6).

Los links del nav (`/leggings`, `/tops`, `/sets`, `/coleccion`, `/nosotras`) todavía llevan al 404.
Las rutas entran en la fase 3; el 404 está diseñado y degrada bien mientras tanto.

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
| §5: acordeón | contenido siempre en el DOM, colapsado con `grid-template-rows: 0fr→1fr` | Google lo indexa aunque esté cerrado, y anima a altura automática sin medir |

---

## Verificado

Con Playwright sobre Chrome real, en `/` y `/sistema`:

- Sin desborde horizontal a 375, 390, 768, 1024 y 1440px
- Sin JavaScript: 0 elementos `.reveal` invisibles
- `prefers-reduced-motion`: 0 elementos invisibles, trazo con `stroke-dashoffset: 0`
- Sin errores de consola ni de hidratación
- El botón en carga no cambia de ancho (0px de salto) y conserva su nombre accesible
- `npm run lint` y `npm run build` limpios

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

**El export estático se cae en la fase 3.** Hoy funciona porque las cuatro rutas se
prerenderizan en build. Catálogo y ficha leen de Firestore y necesitan renderizado en
servidor — que es de lo que depende el SEO (§9.5, §12) — y el checkout necesita Server
Actions. Nada de eso existe en `output: 'export'`. Hay que migrar a **Firebase App Hosting**
(producto distinto, otro flujo) antes de esa fase.

**`robots: { index: false }`** está en el layout raíz. Como el dominio ahora sirve esta app,
**todo `nudesportswear.co` está en `noindex, nofollow`** — la landing anterior sí era
indexable. Se deja así a propósito: es preferible que Google no indexe una tienda cuyo menú
cae en 404. Quitarlo cuando el catálogo esté publicado (fase 3+).

**Rutas del menú en 404.** `/leggings`, `/tops`, `/sets`, `/coleccion` y `/nosotras` no
existen todavía y caen en el 404 diseñado. Entran en la fase 3.

**Placeholders en `src/lib/site.ts`:** el WhatsApp es `+57 300 000 0000`, el mismo del linktree.

**`npm audit`** reporta vulnerabilidades altas en `brace-expansion`, `minimatch` y `postcss`,
todas transitivas de ESLint y de herramientas de build. No llegan al bundle del navegador.
`audit fix --force` bajaría ESLint a la v4 y rompería la configuración.
