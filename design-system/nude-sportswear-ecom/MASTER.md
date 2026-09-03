# Design System Master — NUDE SPORTSWEAR

> **LÓGICA:** Al construir una página, revisar primero `design-system/nude-sportswear-ecom/pages/[pagina].md`.
> Si ese archivo existe, sus reglas **anulan** este Master. Si no, seguir estrictamente lo de abajo.

> **AUTORIDAD:** La fuente de verdad de marca es `ecom/SPEC.md` §2. Este archivo es su expresión
> en tokens. Si algo se contradice, manda SPEC.md.

**Proyecto:** NUDE Sportswear E-commerce
**Stack:** Next.js (App Router) + TypeScript + Tailwind + Firestore
**Diales:** Variance 6/10 (balanceado) · Motion 3/10 (sutil) · Density 2/10 (espacioso)

> **Nota de procedencia.** Este archivo se generó con `ui-ux-pro-max --design-system` y luego se
> **corrigió contra la identidad cerrada de NUDE**. La herramienta propuso paleta piedra + dorado,
> Montserrat, estilo Liquid Glass, radios de 8–16px y sombras: todo eso se descartó porque la
> identidad de Croma Visual es decisión cerrada. Lo que sí se adoptó tal cual: la escala de espaciado
> espaciosa, el tier de movimiento sutil y las reglas de accesibilidad, formularios y stack.

---

## Color

Paleta Desert Dune. **No se amplía.** Ratios verificados contra WCAG AA.

| Rol | Token | Hex | Contraste |
|-----|-------|-----|-----------|
| Fondo principal | `--cream` | `#F6EBDE` | — |
| Superficie elevada | `--white` | `#FDFAF6` | — |
| Fondo alterno | `--sahara` | `#EDD5B8` | — |
| Texto sobre oscuro | `--dune` | `#DEB68E` | 5.20:1 sobre Umber ✅ |
| Línea, borde, ícono, foco | `--line` | `#C4956A` | decorativo |
| Texto principal | `--text` | `#5C3D28` | 8.29:1 sobre Cream ✅ |
| Texto secundario | `--text-muted` | `#7B604C` | 4.93:1 sobre Cream ✅ |
| Línea suave | `--line-soft` | `rgba(196,149,106,.25)` | decorativo |

**Prohibido:** `#000`, `#FFF`, cualquier gris, rojo de error, verde de éxito. Ochre como texto sobre fondo claro (2.27:1).

**Errores:** borde `--line` sólido + texto `--text` + ícono. Nunca rojo.

```css
:root {
  --cream:#F6EBDE; --white:#FDFAF6; --sahara:#EDD5B8; --dune:#DEB68E;
  --line:#C4956A; --text:#5C3D28; --text-muted:#7B604C;
  --line-soft:rgba(196,149,106,.25);
}
```

---

## Tipografía

- **Display:** Cormorant Garamond — 300, 400 + itálica. Solo títulos, manifiesto, nombre de producto.
- **Interfaz:** Jost — 200, 300, 400, 500. Cuerpo, botones, precios, formularios, navegación.

> La herramienta recomendó Cormorant + Montserrat para moda y lujo. Confirma el display serif;
> se mantiene **Jost** en vez de Montserrat porque es geométrica tipo Futura, que es la decisión
> cerrada #4 del brand book.

```
Display XL   Cormorant 300   clamp(40px,7vw,72px)   lh 1.1
Display L    Cormorant 300   clamp(32px,5vw,52px)   lh 1.2
Título       Cormorant 300   clamp(24px,3vw,36px)   lh 1.3
Nombre prod  Cormorant 400   24px
Cuerpo       Jost 300        16px                   lh 1.7
Cuerpo S     Jost 300        14px                   lh 1.6
Precio       Jost 400        22px                   ls .02em
Label        Jost 400        11px MAYÚS             ls .4em
Botón        Jost 400        12px MAYÚS             ls .3em
```

Cuerpo nunca bajo 14px. Precio nunca en serif. Manifiesto nunca en sans.

---

## Espaciado — densidad espaciosa

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-xs` | 4px | Separaciones mínimas |
| `--space-sm` | 8px | Separación entre elementos tocables |
| `--space-md` | 24px | Padding estándar |
| `--space-lg` | 32px | Padding de bloque |
| `--space-xl` | 48px | Separaciones grandes |
| `--space-2xl` | 64px | Margen de sección en móvil |
| `--space-3xl` | 96px | Margen de sección en desktop |

Secciones: 96–140px vertical en desktop, 64–80px en móvil. Ancho máximo 1280px; texto corrido 640px.

---

## Forma

| Propiedad | Valor |
|-----------|-------|
| Radio | **2px** en todo. Sin excepciones |
| Sombras | **Ninguna.** Separación por fondo y línea |
| Bordes | 1px `--line` o `--line-soft` |

> La herramienta propuso radios de 8–16px y cuatro niveles de sombra. Descartado: rompe el
> minimalismo cálido. La profundidad en NUDE se construye con color de fondo, no con elevación.

---

## Componentes

```css
.btn-primary{
  background:var(--text); color:var(--cream);
  font:400 12px/1 'Jost'; letter-spacing:.3em; text-transform:uppercase;
  padding:16px 32px; border-radius:2px; border:none; cursor:pointer;
  transition:background .2s ease, transform .2s ease;
}
.btn-primary:hover{ background:var(--line); transform:translateY(-1px) }
.btn-primary:focus-visible{ outline:2px solid var(--line); outline-offset:3px }

.btn-secondary{
  background:transparent; color:var(--text); border:1px solid var(--text);
  padding:16px 32px; border-radius:2px;
}
.btn-secondary:hover{ background:var(--text); color:var(--cream) }

.card{                                   /* card de producto */
  background:transparent; border:none; box-shadow:none; border-radius:2px;
}
.card img{ aspect-ratio:3/4; object-fit:cover; transition:opacity .3s ease }

.input{
  background:var(--white); border:1px solid var(--sahara); border-radius:2px;
  padding:16px 20px; font:300 15px 'Jost'; color:var(--text);
}
.input:focus{ border-color:var(--line); outline:2px solid var(--line); outline-offset:2px }
.input::placeholder{ color:var(--dune) }

.panel{                                  /* carrito, guía de tallas */
  background:var(--cream); border-left:1px solid var(--line-soft);
  box-shadow:none; backdrop-filter:none;
}
```

> Modales y paneles **sin** `backdrop-filter` ni blur. El fondo se atenúa con Umber al 40%.

---

## Movimiento

Tier **sutil**. Sin GSAP: un fade de 12px no justifica 50KB de librería. `IntersectionObserver` + CSS.

| Momento | Comportamiento |
|---------|----------------|
| Carga inicial | Trazo continuo Ochre se dibuja con `stroke-dashoffset`, 1.2s, una vez |
| Entrada de sección | Fade + 12px arriba, 350ms, `cubic-bezier(.25,.46,.45,.94)` |
| Card de producto | Cruce a segunda foto, 300ms. Sin zoom, sin sombra, sin levantar |
| Panel de carrito | Entra desde la derecha, 300ms |
| Botón | Umber → Ochre + `translateY(-1px)`, 200ms |

```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.01ms!important; transition-duration:.01ms!important }
  .trazo{ stroke-dashoffset:0 }        /* la línea aparece dibujada */
}
```

**Crítico para SEO:** el contenido de catálogo y ficha **no puede estar en `opacity:0` por defecto**. El estado inicial oculto se aplica solo con JS activo (clase en `<html>`); sin JS todo se ve. Un catálogo invisible para el rastreador es un catálogo que no existe en Google.

---

## Íconos

**Phosphor Icons**, peso `light` o `regular`, 20px, color `--line`.

```tsx
import { ShoppingCart, List, ArrowLeft, X, MagnifyingGlass } from '@phosphor-icons/react'
<ShoppingCart size={20} weight="light" />
```

El trazo fino de Phosphor es el que más se parece al isotipo. **Ningún emoji como ícono.** Todo ícono sin texto lleva `aria-label`.

---

## Reglas de stack — Next.js

| Regla | Hacer | No hacer | Severidad |
|-------|-------|----------|-----------|
| Imágenes | `<Image>` de `next/image` siempre | `<img>` directo | Alta |
| Renderizado | Server Components por defecto | `'use client'` sin necesidad | Alta |
| Metadatos | `export const metadata = {}` | Etiquetas `<head>` manuales | Media |

Solo llevan `'use client'`: carrito, selector de variantes, filtros, formulario de checkout y el panel de administración. Catálogo y ficha se renderizan en servidor — es de donde viene el SEO.

---

## Anti-patrones

- ❌ Ochre como texto sobre fondo claro
- ❌ Sombras, radios mayores a 2px, `backdrop-filter`
- ❌ Rojo de error, verde de éxito, cualquier gris
- ❌ Emojis como íconos
- ❌ Hex sueltos en componentes — todo por token
- ❌ Placeholder como etiqueta de campo
- ❌ Contadores regresivos, "12 personas viendo esto", ruedas de descuento
- ❌ Scroll infinito
- ❌ Reseñas inventadas
- ❌ Texto quemado dentro de imágenes de hero
