# Home, catálogo y ficha — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir las tres plantillas del comercio de NUDE — home completa, catálogo por categoría y ficha de producto — sobre un catálogo mock local, con filtros en la URL, el trazo Ochre cumpliendo la promesa del SPEC §11.1 y sin romper el design system de la fase 1.

**Architecture:** Todo el producto pasa por un adaptador `src/lib/productos.ts` con cuatro funciones `async` que hoy leen un JSON y mañana leen Firestore sin que ningún componente cambie. Las páginas son Server Components y se prerenderizan completas (`output: 'export'`); el filtrado y la paginación son **mejora progresiva** en cliente sobre esa grilla ya renderizada, así que sin JavaScript el catálogo se ve entero. La ficha comparte estado de variante por contexto de React, el mismo patrón que ya usa `BuscadorProvider` en el header.

**Tech Stack:** Next.js 16.2.12 (App Router, `output: 'export'`) · React 19.2.4 · TypeScript 5 estricto · Tailwind 4 (solo como puente de tokens, el sistema vive en `globals.css`) · Phosphor Icons `light` · sharp (generación de fotos) · **vitest 3** (nuevo: hoy el proyecto no tiene runner de pruebas) · **playwright** (nuevo devDependency: la verificación de la fase 1 se hizo con Playwright a mano, aquí se vuelve reproducible).

**Spec:** `docs/superpowers/specs/2026-09-06-home-catalogo-ficha-design.md`
**Autoridad de origen:** `SPEC.md` (§4.1, §4.2, §4.3, §5, §6, §7, §9.5, §9.6, §11, §12)
**Estado actual del código:** `tienda/README.md`

---

## Global Constraints

Estas reglas valen para **todas** las tareas. No se repiten en cada una.

**Directorio de trabajo:** todos los comandos se corren desde `tienda/` salvo que se diga otra cosa.

**Identidad visual (SPEC §2, §12 · criterios de aceptación §7 del spec de diseño)**
- Cero hex sueltos en componentes. Todo por token de `globals.css`. **Única excepción:** el `hex` de un color de prenda, que es dato de producto (ver el comentario en `src/components/ui/Selectores.tsx`).
- Cero grises, cero `#000`, cero `#FFF`, cero rojo, cero verde.
- Radio `var(--radius)` = 2px en todo. Única excepción: el swatch circular (`border-radius: 9999px`).
- Sin sombras y sin `backdrop-filter`. `--shadow-*` está borrado del tema: `shadow-md` no compila.
- Un bloque con fondo oscuro usa `.on-dark`; uno Sahara usa `.on-sahara`. **Nunca** `bg-sahara` a mano: esas clases corrigen `--text-muted` al valor que sí pasa AA en ese fondo.
- Los únicos bloques centrados del sitio son el manifiesto y la confirmación de pedido.
- Íconos: solo los reexportados en `src/components/ui/icons.tsx`, `weight="light"`, `size={20}` salvo que se indique otro. Ningún emoji.

**Accesibilidad (SPEC §12)**
- Contraste AA (4.5:1) en todo texto, incluido el que va sobre foto.
- Foco visible en Ochre. `outline` nunca se elimina.
- Toda imagen con `alt` descriptivo; todo botón de solo ícono con `aria-label`.
- Área táctil mínima 44×44px.
- `prefers-reduced-motion` respetado.

**Renderizado (SPEC §9.5)**
- Server Components por defecto. `'use client'` solo donde este plan lo dice explícitamente.
- **Nada se esconde sin JavaScript.** Toda regla que ponga `opacity: 0` o `display: none` para un estado de interfaz vive dentro de `@media (scripting: enabled)`.
- Con JS desactivado, catálogo y ficha se ven completos.
- `output: 'export'` sigue vigente: no hay `searchParams` en servidor, no hay Server Actions. Toda ruta dinámica necesita `generateStaticParams`.

**Voz (SPEC §7)**
- Sin emojis, sin signos de exclamación, sin urgencia falsa, sin contadores, sin porcentajes gritados.
- El microcopy nuevo se agrega a `src/lib/copy.ts`, no se escribe suelto en un componente.

**Idioma del código y del copy:** identificadores, comentarios y **también el texto visible** van en español **sin tildes**. No es un descuido: es la convención de todo el código de la fase 1 — `src/lib/copy.ts` dice `'Todavia no has elegido nada.'`, la home dice `Disenada para moverte`, el header dice `aria-label="Navegacion principal"`. Mezclar acentuación dentro del mismo sitio se ve peor que no tenerla. Si se decide corregirlo, se corrige todo de una vez y en su propio commit, no dentro de esta implementación.

**Comentarios:** el código existente explica *por qué*, no *qué*. Mantener esa densidad: un comentario de bloque por decisión no obvia, ninguno para lo evidente.

**Datos que son placeholder** — cada uno lleva un `TODO` con la decisión abierta del SPEC §13 que lo desbloquea:
- Nombres de producto y de colección → `TODO(decision-abierta-4)`
- Tabla de medidas de la guía de tallas → `TODO(decision-abierta-1)`
- Fotografía de producto → `TODO(decision-abierta-5)`
- Captura de correo sin destino → `TODO(fase-6)`
- Agregar al carrito sin estado de carrito → `TODO(fase-4)`

**Al terminar cada tarea:** `npm run lint` y `npm test` limpios antes del commit.

**Desviaciones del spec de diseño acordadas en este plan** (cada una está justificada en su tarea):
| Desviación | Dónde | Por qué |
|---|---|---|
| `listarProductos` acepta `limite` además de `cursor` | Tarea 1 | Sin él la paginación del adaptador no es verificable con 8 referencias |
| `GridFiltrado.tsx` se separa de `GridProducto.tsx` | Tarea 5 | `GridProducto` tiene que servir en servidor para el SEO; el filtrado es cliente |
| Se añade `lado="abajo"` a `Panel` | Tarea 6 | El spec pide panel **inferior** en móvil y a la vez no modificar `drawer`. Es una variante aditiva: ningún uso existente cambia |
| `.promesas` / `.promesa` se renombran a `.franja-iconos` / `.franja-icono` | Tarea 11 | El bloque 7 cambia de tratamiento; renombrar evita dejar CSS muerto |
| La barra de compra móvil es `sticky`, no `fixed` | Tarea 9 | `fixed` tapa el footer; `sticky` se suelta al terminar la ficha y no necesita relleno inferior |
| Descripción, detalles y acordeones salen de la columna pegajosa | Tarea 9 | Una columna `sticky` más alta que el viewport deja su parte de abajo fuera de alcance. En móvil el orden del spec no cambia |
| La miga de pan va sobre las dos columnas, no dentro de la derecha | Tarea 7 | En móvil las columnas se apilan y la miga acabaría después de la galería, donde ya no orienta |
| Se construye `/colecciones` | Tarea 5 | El spec manda que "Ver todo" de la home lleve ahí; sin la ruta el enlace cae en 404 |

---

## Estructura de archivos

**Se crean**

| Archivo | Responsabilidad |
|---|---|
| `vitest.config.ts` | Runner de pruebas: alias `@`, entorno node |
| `src/lib/producto-modelo.ts` | Tipos y vocabulario del producto (`Producto`, `Categoria`, `Talla`, `CATEGORIAS`, `TALLAS`, guardas) |
| `src/content/productos.json` | Catálogo mock, 8 referencias con el modelo del SPEC §6 |
| `src/lib/productos.ts` | **El adaptador.** Único módulo que importa `productos.json` |
| `src/lib/productos.test.ts` | Pruebas del adaptador |
| `src/lib/filtros.ts` | Filtrado, orden y códec de query params. Funciones puras |
| `src/lib/filtros.test.ts` | Pruebas de filtros |
| `src/lib/tallas.ts` | Tabla de medidas de la guía de tallas |
| `scripts/gen-recortes.mjs` | Recortes 3:4 del tríptico → `assets/fotos/` |
| `scripts/gen-placeholders.mjs` | Placeholders planos con isotipo → `assets/fotos/placeholder/` y `public/fotos/placeholder/` |
| `scripts/verificar.mjs` | Verificación con Playwright: desborde, sin JS, reduced-motion |
| `src/components/producto/CardProducto.tsx` | Card 3:4 con cruce a la segunda foto |
| `src/components/producto/GridProducto.tsx` | Grilla presentacional. Sirve en servidor |
| `src/components/producto/GridFiltrado.tsx` | Cliente: aplica filtros de la URL + "Cargar más" |
| `src/components/producto/Filtros.tsx` | Cliente: barra pegajosa + panel inferior en móvil |
| `src/components/producto/Variante.tsx` | Cliente: contexto de color y talla de la ficha |
| `src/components/producto/Galeria.tsx` | Cliente: miniaturas + principal; móvil carrusel con puntos |
| `src/components/producto/SelectorVariante.tsx` | Cliente: SKU, color, talla, inventario, agregar |
| `src/components/producto/BarraCompra.tsx` | Cliente: barra de compra móvil |
| `src/components/producto/MigaDePan.tsx` | Servidor: miga de pan + JSON-LD |
| `src/components/producto/GuiaTallas.tsx` | Cliente: link + panel lateral con la tabla |
| `src/components/home/TileCategoria.tsx` | Tile a sangre con nombre encima |
| `src/components/home/Comunidad.tsx` | Grilla UGC |
| `src/components/home/Newsletter.tsx` | Cliente: captura de correo |
| `src/app/(tienda)/[categoria]/page.tsx` | Catálogo por categoría |
| `src/app/(tienda)/[categoria]/[slug]/page.tsx` | Ficha de producto |
| `src/app/(tienda)/colecciones/page.tsx` | Catálogo de todo (destino de "Ver todo") |

**Se modifican**

| Archivo | Cambio |
|---|---|
| `package.json` | devDependencies `vitest`, `playwright`; scripts `test`, `verificar` |
| `src/app/globals.css` | Utilidades y bloques nuevos. Ningún token cambia |
| `src/app/(tienda)/page.tsx` | Home completa: 10 bloques |
| `src/lib/copy.ts` | Microcopy nuevo del newsletter y del catálogo |
| `src/lib/site.ts` | `promesas` gana un ícono por promesa |
| `src/components/ui/Panel.tsx` | `lado` acepta `'abajo'` |
| `src/app/(tienda)/sistema/page.tsx` | Bloque nuevo: card de producto |
| `README.md` | Estado real tras la fase 3 |

---

### Task 1: Modelo, catálogo mock y adaptador

Es la base de todo lo demás: sin adaptador no hay catálogo, ni ficha, ni destacados. Incluye montar vitest porque el proyecto todavía no tiene runner y estas cuatro funciones son lo único puramente lógico del trabajo — si no se prueban aquí, no se prueban nunca.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/producto-modelo.ts`
- Create: `src/content/productos.json`
- Create: `src/lib/productos.ts`
- Test: `src/lib/productos.test.ts`

**Interfaces:**
- Consumes: nada.
- Produce (lo usan todas las tareas siguientes):
  - `src/lib/producto-modelo.ts` → `type Categoria = 'leggings' | 'tops' | 'sets'` · `type Talla = 'XS' | 'S' | 'M' | 'L' | 'XL'` · `type EstadoProducto = 'activo' | 'agotado' | 'proximamente'` · `type Variante = { color: string; hex: string; talla: Talla; sku: string; stock: number }` · `type Producto` · `type Orden = 'novedad' | 'precio-asc' | 'precio-desc'` · `const CATEGORIAS: readonly Categoria[]` · `const TALLAS: readonly Talla[]` · `const NOMBRE_CATEGORIA: Record<Categoria, string>` · `esCategoria(v: string): v is Categoria` · `coloresDe(p: Producto): { nombre: string; hex: string }[]` · `tallasDe(p: Producto): Talla[]` · `stockTotal(p: Producto): number` · `stockDe(p: Producto, color: string, talla: Talla): number` · `varianteDe(p: Producto, color: string, talla: Talla): Variante | null` · `type EstadoVisible = 'activo' | 'ultimas' | 'agotado' | 'proximamente'` · `estadoVisible(p: Producto): EstadoVisible`
  - `src/lib/productos.ts` → `listarProductos(opts?: OpcionesListado): Promise<{ productos: Producto[]; siguiente: string | null }>` · `obtenerProducto(slug: string): Promise<Producto | null>` · `destacados(limite?: number): Promise<Producto[]>` · `combinaCon(slug: string): Promise<Producto[]>` · `type OpcionesListado = { categoria?: Categoria; colores?: string[]; tallas?: Talla[]; precio?: { min?: number; max?: number }; orden?: Orden; cursor?: string; limite?: number }`

**Desviación documentada.** El spec de diseño §2.1 no lista `limite` en `listarProductos`. Se añade porque con 8 referencias el `cursor` no se puede ejercitar de otra forma, y una paginación sin prueba es una paginación que se rompe en la fase 2 sin avisar. El resto de la firma es literal.

- [ ] **Step 1: Instalar vitest y declarar el script de pruebas**

```bash
npm install --save-dev vitest@^3
```

En `package.json`, dentro de `"scripts"`, añadir después de `"lint"`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 2: Configurar vitest**

Crear `vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Solo se prueban los modulos de `src/lib`: son las unicas piezas puramente
 * logicas del sitio (adaptador de producto, filtros, formato). Lo visual se
 * verifica con `npm run verificar` sobre un Chrome real, no con jsdom.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

- [ ] **Step 3: Escribir el modelo de producto**

Crear `src/lib/producto-modelo.ts`:

```ts
/**
 * Vocabulario del producto: tipos y derivaciones puras sobre un `Producto`.
 *
 * Vive aparte de `productos.ts` a proposito. El adaptador importa filtros y los
 * filtros importan tipos; si los tipos vivieran en el adaptador habria un ciclo
 * en tiempo de ejecucion. Aqui no hay nada que importar, asi que corta el ciclo.
 *
 * Modelo literal del SPEC §6. No se le agregan campos "por si acaso": lo que no
 * este aqui es lo que la fase 2 tendra que agregar tambien en Firestore.
 */

export type Categoria = 'leggings' | 'tops' | 'sets'
export type Talla = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type EstadoProducto = 'activo' | 'agotado' | 'proximamente'
export type Orden = 'novedad' | 'precio-asc' | 'precio-desc'

export type Variante = {
  /** Nombre del color tal como lo ve la clienta: "Duna". */
  color: string
  /** Hex de la tela. Dato de producto, no token de marca (SPEC §2.1). */
  hex: string
  talla: Talla
  sku: string
  stock: number
}

export type Producto = {
  nombre: string
  slug: string
  categoria: Categoria
  coleccion: string
  /** COP, entero, sin decimales. */
  precio: number
  descripcion: string
  detalles: string[]
  variantes: Variante[]
  /** Clave = nombre del color. Valor = nombres base en `public/fotos`. */
  imagenes: Record<string, string[]>
  /** Slugs de otros productos. */
  combina_con: string[]
  estado: EstadoProducto
  seo: { titulo: string; descripcion: string; alt: string }
}

export const CATEGORIAS = ['leggings', 'tops', 'sets'] as const satisfies readonly Categoria[]

/** SPEC §4.3 — el orden es el de la etiqueta, no alfabetico. */
export const TALLAS = ['XS', 'S', 'M', 'L', 'XL'] as const satisfies readonly Talla[]

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  leggings: 'Leggings',
  tops: 'Tops',
  sets: 'Sets',
}

/** SPEC §4.2 — copy de encabezado por categoria. Dos lineas, para SEO y tono. */
export const INTRO_CATEGORIA: Record<Categoria, string> = {
  leggings:
    'Tejido que se adapta y no se transparenta. Cintura alta que se queda donde la dejas, del primer paso al ultimo.',
  tops: 'Sujecion sin apretar. Se sienten como una segunda capa y se olvidan puestos.',
  sets: 'Legging y top pensados juntos: mismo tono, misma tela, misma caida.',
}

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor)
}

/** Colores del producto en el orden en que aparecen en `variantes`, sin repetir. */
export function coloresDe(p: Producto): { nombre: string; hex: string }[] {
  const vistos = new Map<string, string>()
  for (const v of p.variantes) if (!vistos.has(v.color)) vistos.set(v.color, v.hex)
  return [...vistos].map(([nombre, hex]) => ({ nombre, hex }))
}

/** Tallas del producto en el orden de `TALLAS`, no en el del archivo. */
export function tallasDe(p: Producto): Talla[] {
  const hay = new Set(p.variantes.map((v) => v.talla))
  return TALLAS.filter((t) => hay.has(t))
}

export function stockTotal(p: Producto): number {
  return p.variantes.reduce((n, v) => n + v.stock, 0)
}

export function varianteDe(p: Producto, color: string, talla: Talla): Variante | null {
  return p.variantes.find((v) => v.color === color && v.talla === talla) ?? null
}

export function stockDe(p: Producto, color: string, talla: Talla): number {
  return varianteDe(p, color, talla)?.stock ?? 0
}

export type EstadoVisible = 'activo' | 'ultimas' | 'agotado' | 'proximamente'

/**
 * SPEC §4.2 y §7 — el badge nunca grita. Solo hay tres motivos para poner uno,
 * y "ultimas unidades" tiene que ser cierto: se calcula del stock, no se marca
 * a mano en el archivo.
 */
export const UMBRAL_ULTIMAS = 5

export function estadoVisible(p: Producto): EstadoVisible {
  if (p.estado === 'proximamente') return 'proximamente'
  const total = stockTotal(p)
  if (p.estado === 'agotado' || total === 0) return 'agotado'
  if (total <= UMBRAL_ULTIMAS) return 'ultimas'
  return 'activo'
}
```

- [ ] **Step 4: Escribir el catálogo mock**

Crear `src/content/productos.json`. Ocho referencias: tres leggings, tres tops, dos sets. El orden del archivo **es** el orden `novedad` (más nuevo primero).

`TODO(decision-abierta-4)`: nombres de producto y de colección son provisionales.
`TODO(decision-abierta-5)`: todas las `imagenes` apuntan a placeholders planos.

```json
{
  "productos": [
    {
      "nombre": "Legging Duna",
      "slug": "legging-duna",
      "categoria": "leggings",
      "coleccion": "Primera Piel",
      "precio": 145000,
      "descripcion": "Se pone y desaparece. La cintura alta se queda donde la dejaste y la tela cede con la rodilla en vez de frenarla. Sales del entreno y no te la quieres quitar.",
      "detalles": [
        "78% poliamida, 22% elastano",
        "Cintura alta, cinturilla de 8 cm",
        "Bolsillo lateral para el celular",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["top-brisa", "top-ocre", "set-duna", "legging-cauce"],
      "imagenes": {
        "Duna": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"],
        "Negro Humo": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"]
      },
      "variantes": [
        { "color": "Duna", "hex": "#C8A583", "talla": "XS", "sku": "LEG-DUN-XS", "stock": 6 },
        { "color": "Duna", "hex": "#C8A583", "talla": "S", "sku": "LEG-DUN-S", "stock": 9 },
        { "color": "Duna", "hex": "#C8A583", "talla": "M", "sku": "LEG-DUN-M", "stock": 11 },
        { "color": "Duna", "hex": "#C8A583", "talla": "L", "sku": "LEG-DUN-L", "stock": 7 },
        { "color": "Duna", "hex": "#C8A583", "talla": "XL", "sku": "LEG-DUN-XL", "stock": 0 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XS", "sku": "LEG-NEG-XS", "stock": 4 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "S", "sku": "LEG-NEG-S", "stock": 12 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "M", "sku": "LEG-NEG-M", "stock": 14 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "L", "sku": "LEG-NEG-L", "stock": 8 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XL", "sku": "LEG-NEG-XL", "stock": 3 }
      ],
      "seo": {
        "titulo": "Legging Duna",
        "descripcion": "Legging de cintura alta en tono Duna. Tela que cede con el movimiento y no se transparenta. Envio a todo Colombia.",
        "alt": "Legging Duna de cintura alta, vista frontal sobre fondo calido"
      }
    },
    {
      "nombre": "Top Brisa",
      "slug": "top-brisa",
      "categoria": "tops",
      "coleccion": "Primera Piel",
      "precio": 98000,
      "descripcion": "Sujeta sin apretar. La malla en la espalda deja pasar el aire justo donde hace falta y la banda inferior no se sube al levantar los brazos.",
      "detalles": [
        "80% poliamida, 20% elastano",
        "Sujecion media, sin varillas",
        "Panel de malla en la espalda",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["legging-duna", "legging-cauce", "legging-medano", "set-duna"],
      "imagenes": {
        "Duna": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"],
        "Negro Humo": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"]
      },
      "variantes": [
        { "color": "Duna", "hex": "#C8A583", "talla": "XS", "sku": "TOP-DUN-XS", "stock": 7 },
        { "color": "Duna", "hex": "#C8A583", "talla": "S", "sku": "TOP-DUN-S", "stock": 10 },
        { "color": "Duna", "hex": "#C8A583", "talla": "M", "sku": "TOP-DUN-M", "stock": 9 },
        { "color": "Duna", "hex": "#C8A583", "talla": "L", "sku": "TOP-DUN-L", "stock": 5 },
        { "color": "Duna", "hex": "#C8A583", "talla": "XL", "sku": "TOP-DUN-XL", "stock": 2 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XS", "sku": "TOP-NEG-XS", "stock": 8 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "S", "sku": "TOP-NEG-S", "stock": 11 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "M", "sku": "TOP-NEG-M", "stock": 10 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "L", "sku": "TOP-NEG-L", "stock": 6 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XL", "sku": "TOP-NEG-XL", "stock": 4 }
      ],
      "seo": {
        "titulo": "Top Brisa",
        "descripcion": "Top deportivo de sujecion media con panel de malla en la espalda. Tonos tierra. Envio a todo Colombia.",
        "alt": "Top Brisa de sujecion media, vista frontal sobre fondo calido"
      }
    },
    {
      "nombre": "Set Duna",
      "slug": "set-duna",
      "categoria": "sets",
      "coleccion": "Primera Piel",
      "precio": 225000,
      "descripcion": "Legging y top de la misma tela y el mismo tono. Pensados juntos, cortados juntos: la cinturilla y la banda del top caen a la misma altura.",
      "detalles": [
        "78% poliamida, 22% elastano",
        "Incluye legging de cintura alta y top de sujecion media",
        "Mismo tono y misma caida en las dos prendas",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["legging-duna", "top-brisa", "set-arena", "top-ocre"],
      "imagenes": {
        "Duna": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"]
      },
      "variantes": [
        { "color": "Duna", "hex": "#C8A583", "talla": "XS", "sku": "SET-DUN-XS", "stock": 4 },
        { "color": "Duna", "hex": "#C8A583", "talla": "S", "sku": "SET-DUN-S", "stock": 6 },
        { "color": "Duna", "hex": "#C8A583", "talla": "M", "sku": "SET-DUN-M", "stock": 7 },
        { "color": "Duna", "hex": "#C8A583", "talla": "L", "sku": "SET-DUN-L", "stock": 3 },
        { "color": "Duna", "hex": "#C8A583", "talla": "XL", "sku": "SET-DUN-XL", "stock": 1 }
      ],
      "seo": {
        "titulo": "Set Duna",
        "descripcion": "Conjunto de legging y top en tono Duna, misma tela y misma caida. Envio a todo Colombia.",
        "alt": "Set Duna: legging de cintura alta y top a juego, vista frontal"
      }
    },
    {
      "nombre": "Legging Cauce",
      "slug": "legging-cauce",
      "categoria": "leggings",
      "coleccion": "Primera Piel",
      "precio": 155000,
      "descripcion": "El panel de malla baja por el gemelo y respira donde mas calienta. La costura corre por fuera de la pierna, asi que no roza al correr.",
      "detalles": [
        "76% poliamida, 24% elastano",
        "Cintura alta con panel interno",
        "Malla lateral desde la rodilla",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["top-brisa", "top-umbra", "legging-duna", "set-arena"],
      "imagenes": {
        "Negro Humo": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"],
        "Umbra": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"]
      },
      "variantes": [
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XS", "sku": "LEG-CAU-NEG-XS", "stock": 5 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "S", "sku": "LEG-CAU-NEG-S", "stock": 8 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "M", "sku": "LEG-CAU-NEG-M", "stock": 9 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "L", "sku": "LEG-CAU-NEG-L", "stock": 6 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XL", "sku": "LEG-CAU-NEG-XL", "stock": 2 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "XS", "sku": "LEG-CAU-UMB-XS", "stock": 3 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "S", "sku": "LEG-CAU-UMB-S", "stock": 7 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "M", "sku": "LEG-CAU-UMB-M", "stock": 8 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "L", "sku": "LEG-CAU-UMB-L", "stock": 4 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "XL", "sku": "LEG-CAU-UMB-XL", "stock": 0 }
      ],
      "seo": {
        "titulo": "Legging Cauce",
        "descripcion": "Legging de cintura alta con malla lateral desde la rodilla. Costura externa que no roza. Envio a todo Colombia.",
        "alt": "Legging Cauce con panel de malla lateral, vista de perfil"
      }
    },
    {
      "nombre": "Top Ocre",
      "slug": "top-ocre",
      "categoria": "tops",
      "coleccion": "Primera Piel",
      "precio": 105000,
      "descripcion": "Manga corta y cuello alto. La tela es opaca donde tiene que serlo y translucida en el panel del pecho, que es por donde entra el aire.",
      "detalles": [
        "80% poliamida, 20% elastano",
        "Cuello alto, manga corta",
        "Panel translucido en el pecho",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["legging-duna", "legging-medano", "set-arena", "legging-cauce"],
      "imagenes": {
        "Umbra": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"],
        "Arena": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"]
      },
      "variantes": [
        { "color": "Umbra", "hex": "#5C4232", "talla": "XS", "sku": "TOP-OCR-UMB-XS", "stock": 6 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "S", "sku": "TOP-OCR-UMB-S", "stock": 9 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "M", "sku": "TOP-OCR-UMB-M", "stock": 8 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "L", "sku": "TOP-OCR-UMB-L", "stock": 5 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "XL", "sku": "TOP-OCR-UMB-XL", "stock": 3 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "XS", "sku": "TOP-OCR-ARE-XS", "stock": 4 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "S", "sku": "TOP-OCR-ARE-S", "stock": 7 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "M", "sku": "TOP-OCR-ARE-M", "stock": 6 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "L", "sku": "TOP-OCR-ARE-L", "stock": 2 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "XL", "sku": "TOP-OCR-ARE-XL", "stock": 0 }
      ],
      "seo": {
        "titulo": "Top Ocre",
        "descripcion": "Top de cuello alto y manga corta con panel translucido en el pecho. Tonos tierra. Envio a todo Colombia.",
        "alt": "Top Ocre de cuello alto y manga corta, vista frontal"
      }
    },
    {
      "nombre": "Set Arena",
      "slug": "set-arena",
      "categoria": "sets",
      "coleccion": "Primera Piel",
      "precio": 239000,
      "descripcion": "El conjunto mas claro de la coleccion. Tela de doble capa, opaca a contraluz, con la caida de una prenda de vestir y el agarre de una deportiva.",
      "detalles": [
        "76% poliamida, 24% elastano, doble capa",
        "Incluye legging de cintura alta y top de cuello alto",
        "Opaco a contraluz",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["set-duna", "top-ocre", "legging-medano", "legging-cauce"],
      "imagenes": {
        "Arena": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"]
      },
      "variantes": [
        { "color": "Arena", "hex": "#E2CBAE", "talla": "XS", "sku": "SET-ARE-XS", "stock": 3 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "S", "sku": "SET-ARE-S", "stock": 5 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "M", "sku": "SET-ARE-M", "stock": 6 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "L", "sku": "SET-ARE-L", "stock": 4 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "XL", "sku": "SET-ARE-XL", "stock": 2 }
      ],
      "seo": {
        "titulo": "Set Arena",
        "descripcion": "Conjunto de legging y top en tono Arena, tela de doble capa opaca a contraluz. Envio a todo Colombia.",
        "alt": "Set Arena: legging de cintura alta y top de cuello alto a juego"
      }
    },
    {
      "nombre": "Legging Medano",
      "slug": "legging-medano",
      "categoria": "leggings",
      "coleccion": "Primera Piel",
      "precio": 139000,
      "descripcion": "El mas ligero de los tres. Talle medio, sin costura frontal, pensado para los dias en que la ropa deportiva sale a la calle y no al gimnasio.",
      "detalles": [
        "82% poliamida, 18% elastano",
        "Talle medio, sin costura frontal",
        "Sin bolsillo",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "activo",
      "combina_con": ["top-brisa", "top-ocre", "legging-duna", "set-arena"],
      "imagenes": {
        "Arena": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"],
        "Duna": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"]
      },
      "variantes": [
        { "color": "Arena", "hex": "#E2CBAE", "talla": "XS", "sku": "LEG-MED-ARE-XS", "stock": 0 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "S", "sku": "LEG-MED-ARE-S", "stock": 1 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "M", "sku": "LEG-MED-ARE-M", "stock": 1 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "L", "sku": "LEG-MED-ARE-L", "stock": 0 },
        { "color": "Arena", "hex": "#E2CBAE", "talla": "XL", "sku": "LEG-MED-ARE-XL", "stock": 0 },
        { "color": "Duna", "hex": "#C8A583", "talla": "XS", "sku": "LEG-MED-DUN-XS", "stock": 0 },
        { "color": "Duna", "hex": "#C8A583", "talla": "S", "sku": "LEG-MED-DUN-S", "stock": 2 },
        { "color": "Duna", "hex": "#C8A583", "talla": "M", "sku": "LEG-MED-DUN-M", "stock": 1 },
        { "color": "Duna", "hex": "#C8A583", "talla": "L", "sku": "LEG-MED-DUN-L", "stock": 0 },
        { "color": "Duna", "hex": "#C8A583", "talla": "XL", "sku": "LEG-MED-DUN-XL", "stock": 0 }
      ],
      "seo": {
        "titulo": "Legging Medano",
        "descripcion": "Legging de talle medio sin costura frontal, el mas ligero de la coleccion. Envio a todo Colombia.",
        "alt": "Legging Medano de talle medio, vista frontal sobre fondo calido"
      }
    },
    {
      "nombre": "Top Umbra",
      "slug": "top-umbra",
      "categoria": "tops",
      "coleccion": "Primera Piel",
      "precio": 110000,
      "descripcion": "Espalda cruzada y sujecion alta. Es el top de los dias de impacto, y el unico que no se afloja despues de la decima lavada.",
      "detalles": [
        "80% poliamida, 20% elastano",
        "Sujecion alta, espalda cruzada",
        "Copas removibles",
        "Lavar a mano en agua fria, secar a la sombra"
      ],
      "estado": "agotado",
      "combina_con": ["legging-cauce", "legging-duna", "set-duna", "top-brisa"],
      "imagenes": {
        "Negro Humo": ["placeholder/producto-cream", "placeholder/producto-sahara", "placeholder/producto-white", "placeholder/producto-dune"],
        "Umbra": ["placeholder/producto-sahara", "placeholder/producto-cream", "placeholder/producto-dune", "placeholder/producto-white"]
      },
      "variantes": [
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XS", "sku": "TOP-UMB-NEG-XS", "stock": 0 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "S", "sku": "TOP-UMB-NEG-S", "stock": 0 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "M", "sku": "TOP-UMB-NEG-M", "stock": 0 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "L", "sku": "TOP-UMB-NEG-L", "stock": 0 },
        { "color": "Negro Humo", "hex": "#211D1B", "talla": "XL", "sku": "TOP-UMB-NEG-XL", "stock": 0 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "XS", "sku": "TOP-UMB-UMB-XS", "stock": 0 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "S", "sku": "TOP-UMB-UMB-S", "stock": 0 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "M", "sku": "TOP-UMB-UMB-M", "stock": 0 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "L", "sku": "TOP-UMB-UMB-L", "stock": 0 },
        { "color": "Umbra", "hex": "#5C4232", "talla": "XL", "sku": "TOP-UMB-UMB-XL", "stock": 0 }
      ],
      "seo": {
        "titulo": "Top Umbra",
        "descripcion": "Top de sujecion alta con espalda cruzada y copas removibles. Tonos tierra. Envio a todo Colombia.",
        "alt": "Top Umbra de espalda cruzada, vista trasera"
      }
    }
  ]
}
```

- [ ] **Step 5: Escribir las pruebas del adaptador (fallan)**

Crear `src/lib/productos.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { CATEGORIAS, TALLAS, estadoVisible, stockTotal } from './producto-modelo'
import { combinaCon, destacados, listarProductos, obtenerProducto } from './productos'

describe('integridad del archivo de productos', () => {
  it('no repite slugs', async () => {
    const { productos } = await listarProductos()
    const slugs = productos.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('solo usa categorias y tallas del vocabulario', async () => {
    const { productos } = await listarProductos()
    for (const p of productos) {
      expect(CATEGORIAS).toContain(p.categoria)
      for (const v of p.variantes) expect(TALLAS).toContain(v.talla)
    }
  })

  it('todo combina_con apunta a un producto que existe y nunca a si mismo', async () => {
    const { productos } = await listarProductos()
    const slugs = new Set(productos.map((p) => p.slug))
    for (const p of productos) {
      for (const otro of p.combina_con) {
        expect(slugs.has(otro)).toBe(true)
        expect(otro).not.toBe(p.slug)
      }
    }
  })

  it('todo color con imagenes tiene variantes y al reves', async () => {
    const { productos } = await listarProductos()
    for (const p of productos) {
      const enVariantes = new Set(p.variantes.map((v) => v.color))
      expect(new Set(Object.keys(p.imagenes))).toEqual(enVariantes)
    }
  })
})

describe('listarProductos', () => {
  it('devuelve todo el catalogo en el orden del archivo y sin siguiente', async () => {
    const { productos, siguiente } = await listarProductos()
    expect(productos.length).toBe(8)
    expect(productos[0].slug).toBe('legging-duna')
    expect(siguiente).toBeNull()
  })

  it('filtra por categoria', async () => {
    const { productos } = await listarProductos({ categoria: 'leggings' })
    expect(productos.map((p) => p.slug)).toEqual([
      'legging-duna',
      'legging-cauce',
      'legging-medano',
    ])
  })

  it('ordena por precio ascendente y descendente', async () => {
    const asc = await listarProductos({ orden: 'precio-asc' })
    const desc = await listarProductos({ orden: 'precio-desc' })
    expect(asc.productos[0].slug).toBe('top-brisa')
    expect(desc.productos[0].slug).toBe('set-arena')
  })

  it('pagina con limite y cursor', async () => {
    const p1 = await listarProductos({ limite: 6 })
    expect(p1.productos.length).toBe(6)
    expect(p1.siguiente).toBe('6')

    const p2 = await listarProductos({ limite: 6, cursor: p1.siguiente! })
    expect(p2.productos.length).toBe(2)
    expect(p2.siguiente).toBeNull()
    expect(p2.productos[0].slug).toBe('legging-medano')
  })

  it('un cursor invalido se trata como el principio', async () => {
    const { productos } = await listarProductos({ cursor: 'no-es-un-numero' })
    expect(productos.length).toBe(8)
  })

  it('filtra por color, por talla y por rango de precio', async () => {
    const porColor = await listarProductos({ colores: ['Arena'] })
    expect(porColor.productos.map((p) => p.slug).sort()).toEqual([
      'legging-medano',
      'set-arena',
      'top-ocre',
    ])

    // Solo cuenta una talla con stock: XL de Legging Medano esta en 0 en los dos colores
    const porTalla = await listarProductos({ categoria: 'leggings', tallas: ['XL'] })
    expect(porTalla.productos.map((p) => p.slug)).toEqual(['legging-duna', 'legging-cauce'])

    const porPrecio = await listarProductos({ precio: { min: 200000 } })
    expect(porPrecio.productos.map((p) => p.slug)).toEqual(['set-duna', 'set-arena'])
  })

  it('combina filtros con orden', async () => {
    const { productos } = await listarProductos({ categoria: 'tops', orden: 'precio-desc' })
    expect(productos.map((p) => p.slug)).toEqual(['top-umbra', 'top-ocre', 'top-brisa'])
  })
})

describe('obtenerProducto', () => {
  it('devuelve el producto por slug', async () => {
    const p = await obtenerProducto('set-duna')
    expect(p?.nombre).toBe('Set Duna')
  })

  it('devuelve null si el slug no existe', async () => {
    expect(await obtenerProducto('no-existe')).toBeNull()
  })
})

describe('destacados', () => {
  it('devuelve cuatro por defecto y ninguno agotado', async () => {
    const lista = await destacados()
    expect(lista.length).toBe(4)
    for (const p of lista) expect(estadoVisible(p)).not.toBe('agotado')
  })

  it('respeta el limite', async () => {
    expect((await destacados(2)).length).toBe(2)
  })
})

describe('combinaCon', () => {
  it('devuelve los productos de combina_con en su orden', async () => {
    const lista = await combinaCon('legging-duna')
    expect(lista.map((p) => p.slug)).toEqual([
      'top-brisa',
      'top-ocre',
      'set-duna',
      'legging-cauce',
    ])
  })

  it('devuelve lista vacia si el slug no existe', async () => {
    expect(await combinaCon('no-existe')).toEqual([])
  })
})

describe('derivaciones del modelo', () => {
  it('marca agotado el producto sin stock y ultimas el de stock bajo', async () => {
    const umbra = await obtenerProducto('top-umbra')
    const medano = await obtenerProducto('legging-medano')
    expect(stockTotal(umbra!)).toBe(0)
    expect(estadoVisible(umbra!)).toBe('agotado')
    expect(estadoVisible(medano!)).toBe('ultimas')
  })
})
```

- [ ] **Step 6: Correr las pruebas y ver que fallan**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./productos"`.

- [ ] **Step 7: Escribir el adaptador**

Crear `src/lib/productos.ts`:

```ts
import archivo from '@/content/productos.json'
import type { Categoria, Orden, Producto, Talla } from './producto-modelo'
import { estadoVisible } from './producto-modelo'

/**
 * EL ADAPTADOR. Unico modulo del sitio que importa `productos.json`.
 *
 * Las cuatro funciones son `async` aunque hoy lean un archivo sincrono. Es la
 * decision que hace que la fase 2 no duela: cuando el catalogo pase a Firestore
 * (SPEC §9.2) cambia el cuerpo de estas cuatro funciones y ningun componente se
 * toca. Si alguna fuera sincrona, cada pagina que la llama tendria que cambiar.
 *
 * TODO(fase-2): reemplazar el import por consultas a la coleccion `productos`.
 * El tipo `Producto` es el contrato que debe devolver ese documento.
 */

const catalogo = archivo.productos as Producto[]

export type OpcionesListado = {
  categoria?: Categoria
  /** Nombres de color, tal como los ve la clienta. */
  colores?: string[]
  tallas?: Talla[]
  precio?: { min?: number; max?: number }
  orden?: Orden
  /** Opaco. Hoy es el indice del siguiente elemento; en Firestore sera otro. */
  cursor?: string
  /** Sin limite, devuelve todo lo que queda desde el cursor. */
  limite?: number
}

/** Un producto pasa el filtro de color/talla solo si esa variante tiene stock. */
function pasaVariantes(p: Producto, colores?: string[], tallas?: Talla[]): boolean {
  if (!colores?.length && !tallas?.length) return true
  return p.variantes.some(
    (v) =>
      v.stock > 0 &&
      (!colores?.length || colores.includes(v.color)) &&
      (!tallas?.length || tallas.includes(v.talla)),
  )
}

function pasaPrecio(p: Producto, precio?: { min?: number; max?: number }): boolean {
  if (precio?.min != null && p.precio < precio.min) return false
  if (precio?.max != null && p.precio > precio.max) return false
  return true
}

/**
 * `novedad` es el orden del archivo: mas nuevo primero. No hay campo de fecha
 * porque no hay nada que lo alimente todavia — anadirlo ahora seria un dato que
 * alguien tendria que mantener a mano sin usarlo.
 * TODO(fase-2): ordenar por `creado` cuando Firestore lo tenga.
 */
function ordenar(lista: Producto[], orden: Orden = 'novedad'): Producto[] {
  if (orden === 'novedad') return lista
  const signo = orden === 'precio-asc' ? 1 : -1
  return [...lista].sort((a, b) => signo * (a.precio - b.precio))
}

export async function listarProductos(
  opts: OpcionesListado = {},
): Promise<{ productos: Producto[]; siguiente: string | null }> {
  const { categoria, colores, tallas, precio, orden, cursor, limite } = opts

  const filtrados = ordenar(
    catalogo.filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        pasaVariantes(p, colores, tallas) &&
        pasaPrecio(p, precio),
    ),
    orden,
  )

  // Un cursor que no se entiende es un cursor de otra version del sitio. Se
  // empieza por el principio en vez de devolver vacio: un catalogo en blanco es
  // peor que un catalogo repetido.
  const desde = Number.parseInt(cursor ?? '', 10)
  const inicio = Number.isInteger(desde) && desde > 0 ? desde : 0
  const hasta = limite == null ? filtrados.length : inicio + limite
  const pagina = filtrados.slice(inicio, hasta)

  return {
    productos: pagina,
    siguiente: hasta < filtrados.length ? String(hasta) : null,
  }
}

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  return catalogo.find((p) => p.slug === slug) ?? null
}

/** SPEC §4.1 bloque 5 — cuatro en grilla. Nada agotado: no se destaca lo que no se puede vender. */
export async function destacados(limite = 4): Promise<Producto[]> {
  return catalogo.filter((p) => estadoVisible(p) !== 'agotado').slice(0, limite)
}

/** SPEC §4.3 — "Completa el look". Respeta el orden de `combina_con`. */
export async function combinaCon(slug: string): Promise<Producto[]> {
  const producto = catalogo.find((p) => p.slug === slug)
  if (!producto) return []
  return producto.combina_con
    .map((otro) => catalogo.find((p) => p.slug === otro))
    .filter((p): p is Producto => Boolean(p))
}
```

- [ ] **Step 8: Correr las pruebas y ver que pasan**

Run: `npm test`
Expected: PASS — todas.

Si `it('filtra por color, por talla y por rango de precio')` falla, es que el JSON del paso 4 se copió mal: son los datos, no el adaptador. Verificar los `stock` de `LEG-MED-*-XL` (todos 0) y de `LEG-DUN-XL` (0) contra el archivo.

- [ ] **Step 9: Lint y commit**

```bash
npm run lint
git add package.json package-lock.json vitest.config.ts src/lib/producto-modelo.ts src/lib/productos.ts src/lib/productos.test.ts src/content/productos.json
git commit -m "$(cat <<'EOF'
feat(catalogo): adaptador de producto sobre catalogo mock

Cuatro funciones async desde hoy: cuando el catalogo pase a Firestore
cambia el cuerpo y ningun componente se toca. Ningun componente importa
productos.json.

Entra vitest: estas funciones son lo unico puramente logico del trabajo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 2: Filtros, orden y códec de URL

Los filtros viven en la URL para que se compartan y el botón atrás funcione (criterio de aceptación). Toda esa lógica es pura y se prueba sin navegador; los componentes de la tarea 6 solo la conectan a `useSearchParams`.

**Files:**
- Create: `src/lib/filtros.ts`
- Test: `src/lib/filtros.test.ts`

**Interfaces:**
- Consumes: de `producto-modelo.ts` — `Producto`, `Talla`, `Orden`, `TALLAS`, `coloresDe`.
- Produce:
  - `type FiltrosActivos = { colores: string[]; tallas: Talla[]; precio: { min?: number; max?: number }; orden: Orden }`
  - `const FILTROS_VACIOS: FiltrosActivos`
  - `type OpcionesFiltro = { colores: { nombre: string; hex: string }[]; tallas: Talla[]; precio: { min: number; max: number } }`
  - `leerFiltros(params: URLSearchParams | ReadonlyURLSearchParams): FiltrosActivos`
  - `escribirFiltros(f: FiltrosActivos): string` — query string sin `?`, vacía si no hay nada activo
  - `aplicarFiltros(productos: Producto[], f: FiltrosActivos): Producto[]`
  - `opcionesDe(productos: Producto[]): OpcionesFiltro`
  - `cuantosActivos(f: FiltrosActivos): number`

- [ ] **Step 1: Escribir las pruebas (fallan)**

Crear `src/lib/filtros.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Producto, Talla } from './producto-modelo'
import {
  FILTROS_VACIOS,
  aplicarFiltros,
  cuantosActivos,
  escribirFiltros,
  leerFiltros,
  opcionesDe,
} from './filtros'
import { listarProductos } from './productos'

async function todos(): Promise<Producto[]> {
  return (await listarProductos()).productos
}

describe('leerFiltros', () => {
  it('sin parametros devuelve los filtros vacios', () => {
    expect(leerFiltros(new URLSearchParams())).toEqual(FILTROS_VACIOS)
  })

  it('lee colores y tallas separados por coma', () => {
    const f = leerFiltros(new URLSearchParams('color=Duna,Arena&talla=S,M'))
    expect(f.colores).toEqual(['Duna', 'Arena'])
    expect(f.tallas).toEqual(['S', 'M'])
  })

  it('descarta tallas que no existen', () => {
    expect(leerFiltros(new URLSearchParams('talla=S,XXL')).tallas).toEqual(['S'])
  })

  it('lee el rango de precio y descarta lo que no es numero', () => {
    expect(leerFiltros(new URLSearchParams('min=100000&max=abc')).precio).toEqual({
      min: 100000,
    })
  })

  it('cae a novedad si el orden no es uno de los tres', () => {
    expect(leerFiltros(new URLSearchParams('orden=lo-que-sea')).orden).toBe('novedad')
    expect(leerFiltros(new URLSearchParams('orden=precio-desc')).orden).toBe('precio-desc')
  })
})

describe('escribirFiltros', () => {
  it('no escribe nada cuando no hay filtros', () => {
    expect(escribirFiltros(FILTROS_VACIOS)).toBe('')
  })

  it('omite el orden por defecto', () => {
    expect(escribirFiltros({ ...FILTROS_VACIOS, colores: ['Duna'] })).toBe('color=Duna')
  })

  it('es el inverso de leerFiltros', () => {
    const original = {
      colores: ['Duna', 'Arena'],
      tallas: ['S', 'M'] as Talla[],
      precio: { min: 100000, max: 200000 },
      orden: 'precio-asc' as const,
    }
    expect(leerFiltros(new URLSearchParams(escribirFiltros(original)))).toEqual(original)
  })
})

describe('aplicarFiltros', () => {
  it('sin filtros devuelve la lista tal cual', async () => {
    const lista = await todos()
    expect(aplicarFiltros(lista, FILTROS_VACIOS)).toEqual(lista)
  })

  it('filtra por color', async () => {
    const lista = aplicarFiltros(await todos(), { ...FILTROS_VACIOS, colores: ['Umbra'] })
    expect(lista.map((p) => p.slug).sort()).toEqual(['legging-cauce', 'top-ocre'])
  })

  it('solo cuenta la talla si esa variante tiene stock', async () => {
    const lista = aplicarFiltros(await todos(), { ...FILTROS_VACIOS, tallas: ['XL'] })
    expect(lista.map((p) => p.slug)).not.toContain('legging-medano')
    expect(lista.map((p) => p.slug)).not.toContain('top-umbra')
  })

  it('cruza color y talla sobre la misma variante', async () => {
    // Legging Medano solo tiene stock en Duna S/M y Arena S/M
    const lista = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      colores: ['Duna'],
      tallas: ['S'],
    })
    expect(lista.map((p) => p.slug)).toContain('legging-medano')

    const vacia = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      colores: ['Duna'],
      tallas: ['XL'],
    })
    expect(vacia.map((p) => p.slug)).not.toContain('legging-medano')
  })

  it('filtra por rango de precio', async () => {
    const lista = aplicarFiltros(await todos(), {
      ...FILTROS_VACIOS,
      precio: { min: 100000, max: 150000 },
    })
    expect(lista.map((p) => p.slug).sort()).toEqual([
      'legging-duna',
      'legging-medano',
      'top-ocre',
      'top-umbra',
    ])
  })

  it('ordena sin mutar la lista original', async () => {
    const lista = await todos()
    const copia = [...lista]
    const ordenada = aplicarFiltros(lista, { ...FILTROS_VACIOS, orden: 'precio-asc' })
    expect(ordenada[0].slug).toBe('top-brisa')
    expect(lista).toEqual(copia)
  })
})

describe('opcionesDe', () => {
  it('reune colores sin repetir y tallas en el orden de la etiqueta', async () => {
    const o = opcionesDe(await todos())
    expect(o.colores.map((c) => c.nombre).sort()).toEqual([
      'Arena',
      'Duna',
      'Negro Humo',
      'Umbra',
    ])
    expect(o.tallas).toEqual(['XS', 'S', 'M', 'L', 'XL'])
    expect(o.precio).toEqual({ min: 98000, max: 239000 })
  })
})

describe('cuantosActivos', () => {
  it('cuenta cada dimension una vez y no cuenta el orden', () => {
    expect(cuantosActivos(FILTROS_VACIOS)).toBe(0)
    expect(cuantosActivos({ ...FILTROS_VACIOS, orden: 'precio-asc' })).toBe(0)
    expect(
      cuantosActivos({
        colores: ['Duna', 'Arena'],
        tallas: ['S'],
        precio: { min: 100000 },
        orden: 'novedad',
      }),
    ).toBe(4)
  })
})
```

- [ ] **Step 2: Correr las pruebas y ver que fallan**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./filtros"`.

- [ ] **Step 3: Escribir el módulo de filtros**

Crear `src/lib/filtros.ts`:

```ts
import type { Orden, Producto, Talla } from './producto-modelo'
import { TALLAS, coloresDe } from './producto-modelo'

/**
 * Filtros del catalogo: leerlos de la URL, escribirlos a la URL y aplicarlos a
 * una lista. Todo puro — no toca `window`, no toca React.
 *
 * Los filtros viven en la URL a proposito (criterio de aceptacion): un filtro
 * se puede compartir por WhatsApp y el boton atras funciona. Si vivieran en
 * `useState` las dos cosas se pierden.
 *
 * Se importan tipos de `producto-modelo` con `import type` donde se puede para
 * no crear un ciclo en tiempo de ejecucion con `productos.ts`, que si importa
 * valores de aqui.
 */

export type FiltrosActivos = {
  colores: string[]
  tallas: Talla[]
  precio: { min?: number; max?: number }
  orden: Orden
}

export const FILTROS_VACIOS: FiltrosActivos = {
  colores: [],
  tallas: [],
  precio: {},
  orden: 'novedad',
}

export type OpcionesFiltro = {
  colores: { nombre: string; hex: string }[]
  tallas: Talla[]
  precio: { min: number; max: number }
}

const ORDENES: readonly Orden[] = ['novedad', 'precio-asc', 'precio-desc']

/** `ReadonlyURLSearchParams` de Next expone la misma superficie que se usa aqui. */
type Params = Pick<URLSearchParams, 'get'>

function lista(params: Params, clave: string): string[] {
  const crudo = params.get(clave)
  if (!crudo) return []
  return crudo
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function numero(params: Params, clave: string): number | undefined {
  const n = Number(params.get(clave))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function leerFiltros(params: Params): FiltrosActivos {
  const orden = params.get('orden')
  const min = numero(params, 'min')
  const max = numero(params, 'max')

  return {
    colores: lista(params, 'color'),
    // Una talla que no existe en el vocabulario es una URL de otra version del
    // sitio o escrita a mano. Se descarta en vez de dejar la grilla vacia.
    tallas: lista(params, 'talla').filter((t): t is Talla =>
      (TALLAS as readonly string[]).includes(t),
    ),
    precio: { ...(min != null && { min }), ...(max != null && { max }) },
    orden: ORDENES.includes(orden as Orden) ? (orden as Orden) : 'novedad',
  }
}

/** Devuelve el query string sin `?`. Lo que esta en su valor por defecto no se escribe. */
export function escribirFiltros(f: FiltrosActivos): string {
  const params = new URLSearchParams()
  if (f.colores.length) params.set('color', f.colores.join(','))
  if (f.tallas.length) params.set('talla', f.tallas.join(','))
  if (f.precio.min != null) params.set('min', String(f.precio.min))
  if (f.precio.max != null) params.set('max', String(f.precio.max))
  if (f.orden !== 'novedad') params.set('orden', f.orden)
  return params.toString()
}

/**
 * Color y talla se cruzan sobre la MISMA variante y solo cuentan si tiene stock:
 * pedir "Duna" y "XL" tiene que devolver lo que existe en Duna talla XL, no lo
 * que existe en Duna por un lado y en XL por otro.
 */
function pasaVariantes(p: Producto, f: FiltrosActivos): boolean {
  if (!f.colores.length && !f.tallas.length) return true
  return p.variantes.some(
    (v) =>
      v.stock > 0 &&
      (!f.colores.length || f.colores.includes(v.color)) &&
      (!f.tallas.length || f.tallas.includes(v.talla)),
  )
}

export function aplicarFiltros(productos: Producto[], f: FiltrosActivos): Producto[] {
  const filtrados = productos.filter(
    (p) =>
      pasaVariantes(p, f) &&
      (f.precio.min == null || p.precio >= f.precio.min) &&
      (f.precio.max == null || p.precio <= f.precio.max),
  )

  if (f.orden === 'novedad') return filtrados
  const signo = f.orden === 'precio-asc' ? 1 : -1
  return [...filtrados].sort((a, b) => signo * (a.precio - b.precio))
}

/** Lo que la barra de filtros puede ofrecer, sacado del catalogo real. */
export function opcionesDe(productos: Producto[]): OpcionesFiltro {
  const colores = new Map<string, string>()
  const tallas = new Set<Talla>()
  let min = Infinity
  let max = 0

  for (const p of productos) {
    for (const c of coloresDe(p)) if (!colores.has(c.nombre)) colores.set(c.nombre, c.hex)
    for (const v of p.variantes) tallas.add(v.talla)
    min = Math.min(min, p.precio)
    max = Math.max(max, p.precio)
  }

  return {
    colores: [...colores].map(([nombre, hex]) => ({ nombre, hex })),
    tallas: TALLAS.filter((t) => tallas.has(t)),
    precio: { min: Number.isFinite(min) ? min : 0, max },
  }
}

/** Para el contador del boton "Filtrar" en movil. El orden no es un filtro. */
export function cuantosActivos(f: FiltrosActivos): number {
  return (
    f.colores.length +
    f.tallas.length +
    (f.precio.min != null ? 1 : 0) +
    (f.precio.max != null ? 1 : 0)
  )
}
```

- [ ] **Step 4: Correr las pruebas**

Run: `npm test`
Expected: PASS — las de `filtros` y las de `productos`.

- [ ] **Step 5: Lint y commit**

```bash
npm run lint
git add src/lib/filtros.ts src/lib/filtros.test.ts
git commit -m "$(cat <<'EOF'
feat(catalogo): filtros, orden y codec de query params

Puros y probados sin navegador. Los filtros viven en la URL para que se
compartan y el boton atras funcione; color y talla se cruzan sobre la
misma variante y solo cuentan si tiene stock.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 3: Fotografía — recortes del tríptico y placeholders de producto

Sin imágenes no se puede verificar ni la card, ni la galería, ni los tiles. Son dos generadores distintos porque son dos cosas distintas: los recortes son fotografía real (tres tomas de una misma sesión, legítimas por separado) y los placeholders son marcas de posición desechables.

**Files:**
- Create: `scripts/gen-recortes.mjs`
- Create: `scripts/gen-placeholders.mjs`
- Create (generado): `../assets/fotos/categoria-{leggings,tops,sets}.png`, `../assets/fotos/comunidad-{1..6}.png`
- Create (generado): `../assets/fotos/placeholder/producto-{sahara,cream,dune,white}.png` + `README.md`
- Create (generado): `public/fotos/categoria-*`, `public/fotos/comunidad-*`, `public/fotos/placeholder/producto-*`

**Interfaces:**
- Consumes: `../assets/fotos/home-hero.png` (1366×768), `../assets/brand/nude-isotipo.svg`.
- Produce (los usan las tareas 4, 7, 10 y 11):
  - Recortes 3:4 de **441×588** → `<FotoFondo nombre="categoria-leggings" anchos={[441]} ancho={441} alto={588} />`
  - Recortes de comunidad 4–6 de **360×480** → `anchos={[360]} ancho={360} alto={480}`
  - Placeholders de **900×1200** → `<FotoFondo nombre="placeholder/producto-sahara" anchos={[900]} ancho={900} alto={1200} />`

- [ ] **Step 1: Escribir el generador de recortes**

Crear `scripts/gen-recortes.mjs`:

```js
/**
 * Recortes 3:4 del triptico del hero.
 *
 *   node scripts/gen-recortes.mjs && node scripts/gen-fotos.mjs
 *
 * `assets/fotos/home-hero.png` es un triptico de 1366x768: TRES tomas distintas
 * de la misma sesion, no la misma foto tres veces. Recortarlas por separado para
 * los tiles de categoria y la grilla de comunidad es legitimo; repetir el mismo
 * encuadre no lo seria, asi que cada salida tiene su propia ventana.
 *
 * Escribe en `assets/fotos/` a proposito: desde ahi `gen-fotos.mjs` genera las
 * variantes AVIF/WebP/JPG con la misma calidad que el resto del sitio.
 *
 * TODO(decision-abierta-5): esto desaparece cuando haya sesion de producto real.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const FUENTE = resolve(here, '../../assets/fotos/home-hero.png')
const SALIDA = resolve(here, '../../assets/fotos')

/** Los tres paneles del triptico. `x` esquiva la banda blanca que los separa. */
const PANELES = [
  { x: 6, w: 441 }, // perfil: espalda del top y cinturilla del legging
  { x: 464, w: 441 }, // frontal: torso y top
  { x: 920, w: 441 }, // cuerpo entero
]

const alto = (w) => Math.round((w * 4) / 3)

/**
 * `y` se elige por lo que tiene que quedar dentro, no por centrar:
 * el tile de leggings baja al maximo para que entre la cinturilla, el de tops
 * sube al torso y el de sets busca el cuerpo entero.
 */
const RECORTES = [
  { nombre: 'categoria-leggings', panel: 0, y: 180 },
  { nombre: 'categoria-tops', panel: 1, y: 90 },
  { nombre: 'categoria-sets', panel: 2, y: 150 },
  { nombre: 'comunidad-1', panel: 0, y: 0 },
  { nombre: 'comunidad-2', panel: 1, y: 0 },
  { nombre: 'comunidad-3', panel: 2, y: 0 },
  // Ventana mas corta y mas baja: encuadre distinto, no el mismo recorte movido
  { nombre: 'comunidad-4', panel: 0, y: 208, w: 360, dx: 40 },
  { nombre: 'comunidad-5', panel: 1, y: 208, w: 360, dx: 40 },
  { nombre: 'comunidad-6', panel: 2, y: 208, w: 360, dx: 40 },
]

for (const r of RECORTES) {
  const panel = PANELES[r.panel]
  const w = r.w ?? panel.w
  const h = alto(w)
  const left = panel.x + (r.dx ?? 0)

  await sharp(FUENTE)
    .extract({ left, top: r.y, width: w, height: h })
    .png()
    .toFile(`${SALIDA}/${r.nombre}.png`)

  console.log(`${r.nombre}  ${w}x${h}  desde (${left}, ${r.y})`)
}
```

- [ ] **Step 2: Correr el generador y comprobar tamaños**

```bash
node scripts/gen-recortes.mjs
```

Expected: nueve líneas, seis con `441x588` y tres con `360x480`.

- [ ] **Step 3: Revisar los recortes a ojo y ajustar `y` si hace falta**

```bash
open ../assets/fotos/categoria-leggings.png ../assets/fotos/categoria-tops.png ../assets/fotos/categoria-sets.png
```

Criterio: ninguna cabeza cortada por la mitad y la prenda que da nombre al tile visible. Si algo se corta, mover solo la `y` de ese recorte (rango válido 0–180 para los de 588 de alto, 0–288 para los de 480) y volver a correr el paso 2. No cambiar `x` ni `w`: están calculados sobre las bandas del tríptico.

- [ ] **Step 4: Escribir el generador de placeholders**

Crear `scripts/gen-placeholders.mjs`:

```js
/**
 * Marcas de posicion de fotografia de producto: fondo plano de la paleta con el
 * isotipo centrado.
 *
 *   node scripts/gen-placeholders.mjs
 *
 * Son DESECHABLES. Existen para poder verificar el cruce a la segunda foto de la
 * card y las miniaturas de la galeria; en cuanto haya sesion de producto real
 * (SPEC §13, decision abierta 5) se borran los archivos y se cambia `imagenes`
 * en `src/content/productos.json`.
 *
 * No pasan por `gen-fotos.mjs`: ese script recorre `assets/fotos/` a un solo
 * nivel y estos viven en un subdirectorio, precisamente para que no se mezclen
 * con la fotografia de verdad. Las variantes web se escriben aqui.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const ISOTIPO = resolve(here, '../../assets/brand/nude-isotipo.svg')
const ORIGINALES = resolve(here, '../../assets/fotos/placeholder')
const WEB = resolve(here, '../public/fotos/placeholder')

const ANCHO = 900
const ALTO = 1200 // 3:4, el mismo encuadre que pide el SPEC §6

/** Cuatro superficies de la paleta. Ni un hex fuera de SPEC §2.1. */
const FONDOS = [
  { nombre: 'producto-sahara', fondo: '#EDD5B8' },
  { nombre: 'producto-cream', fondo: '#F6EBDE' },
  { nombre: 'producto-dune', fondo: '#DEB68E' },
  { nombre: 'producto-white', fondo: '#FDFAF6' },
]

/** Umber al 40% sobre Sahara: el mismo tono que usa `.img-placeholder` en CSS. */
const TRAZO = '#B3987E'

const ISOTIPO_RATIO = 0.794115
const anchoIsotipo = Math.round(ANCHO * 0.28)
const altoIsotipo = Math.round(anchoIsotipo / ISOTIPO_RATIO)

// El SVG oficial pinta con `currentColor`, que sharp no resuelve: no hay
// elemento padre del que heredar. Se sustituye por el hex antes de rasterizar.
const marca = readFileSync(ISOTIPO, 'utf8')
  .replaceAll('currentColor', TRAZO)
  .replace('<svg', `<svg width="${anchoIsotipo}" height="${altoIsotipo}"`)

mkdirSync(ORIGINALES, { recursive: true })
mkdirSync(WEB, { recursive: true })

for (const { nombre, fondo } of FONDOS) {
  const png = await sharp({
    create: { width: ANCHO, height: ALTO, channels: 4, background: fondo },
  })
    .composite([{ input: Buffer.from(marca), gravity: 'centre' }])
    .png()
    .toBuffer()

  writeFileSync(`${ORIGINALES}/${nombre}.png`, png)

  await sharp(png).avif({ quality: 52 }).toFile(`${WEB}/${nombre}-${ANCHO}.avif`)
  await sharp(png).webp({ quality: 72 }).toFile(`${WEB}/${nombre}-${ANCHO}.webp`)
  await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toFile(`${WEB}/${nombre}-${ANCHO}.jpg`)

  console.log(`${nombre}  ${ANCHO}x${ALTO}  ${fondo}`)
}

writeFileSync(
  `${ORIGINALES}/README.md`,
  `# Placeholders de producto — DESECHABLES

Generados por \`tienda/scripts/gen-placeholders.mjs\`. No son fotografia: son un
fondo plano de la paleta con el isotipo centrado, para poder construir y
verificar la card, la galeria y la ficha antes de que exista sesion de producto.

**Se borran completos** cuando entre la fotografia real (SPEC §13, decision
abierta 5). Lo que hay que cambiar entonces es \`imagenes\` en
\`tienda/src/content/productos.json\` y borrar este directorio junto con
\`tienda/public/fotos/placeholder/\`.

Los minimos que tendra que cumplir la foto de verdad estan en SPEC §6: fondo
Cream o Sahara, luz natural calida y lateral, sin flash directo, 3:4, minimo
1600px de ancho, y \`alt\` descriptivo en cada una.
`,
)
```

- [ ] **Step 5: Generar placeholders y variantes web de todo**

```bash
node scripts/gen-placeholders.mjs
node scripts/gen-fotos.mjs
ls public/fotos public/fotos/placeholder
```

Expected: `public/fotos/` con `home-hero-*`, `categoria-*-441.*`, `comunidad-{1,2,3}-441.*`, `comunidad-{4,5,6}-360.*`; `public/fotos/placeholder/` con las doce variantes (cuatro nombres × avif/webp/jpg).

- [ ] **Step 6: Commit**

```bash
cd .. && git add assets/fotos tienda/public/fotos tienda/scripts/gen-recortes.mjs tienda/scripts/gen-placeholders.mjs && cd tienda
git commit -m "$(cat <<'EOF'
feat(fotos): recortes 3:4 del triptico y placeholders de producto

El hero es un triptico de tres tomas distintas: recortarlas por separado
para tiles y comunidad es legitimo. Los placeholders de producto son
desechables y su README dice cuando se borran.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 4: Base de composición y card de producto

Las dos utilidades de composición (`.a-sangre`, `.eje`) sostienen todo el trabajo visual que viene después, y la card es la pieza que más se repite: aparece en catálogo, en destacados y en "Completa el look". Se verifica en `/sistema`, que es la herramienta que ya existe para eso.

**Files:**
- Modify: `src/app/globals.css` (bloque nuevo `10i`, después de `10h. Pagina de sistema`)
- Create: `src/components/producto/CardProducto.tsx`
- Create: `src/components/producto/GridProducto.tsx`
- Modify: `src/app/(tienda)/sistema/page.tsx`

**Interfaces:**
- Consumes: `Producto`, `coloresDe`, `estadoVisible` de `producto-modelo.ts`; `destacados` de `productos.ts`; `FotoFondo`; `formatCOP`, `cx`.
- Produce:
  - `CardProducto({ producto }: { producto: Producto })` — Server Component
  - `GridProducto({ productos }: { productos: Producto[] })` — Server Component, renderiza `<ul class="grid-producto">`
  - Clases CSS: `.a-sangre`, `.eje`, `.eje-fin`, `.grid-producto`, `.card`, `.card-foto`, `.card-foto-2`, `.card-badge`, `.card-info`, `.card-swatches`, `.card-swatch`

- [ ] **Step 1: Añadir las utilidades de composición y la card a `globals.css`**

Insertar antes de `/* ---------- 11. Superficies ---------- */`:

```css
/* ---------- 10i. Composicion (spec de diseno 2026-09-06, §2.3) ---------- */

/**
 * A sangre: escapa del contenedor de 1280px y llega a los bordes de la pantalla.
 * `100vw` cuenta la barra de scroll; `overflow-x: hidden` en el body absorbe esa
 * diferencia, que es de donde saldria una barra horizontal (SPEC §12).
 *
 * El contraste entre margen amplio y foto a borde es de donde sale la fuerza de
 * la composicion. Se consigue sin centrar nada y sin tocar la identidad.
 */
.a-sangre {
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
}

/**
 * El eje izquierdo del SPEC §11.2 como grid: columna de texto de maximo 640px y
 * margen derecho generoso. Nada se centra. `.eje-fin` es la excepcion: lo que
 * tiene que caer al otro extremo de la misma linea, como el "Ver todo" de una
 * seccion. En movil todo vuelve a una sola columna sobre el mismo eje.
 */
.eje {
  display: grid;
  grid-template-columns: minmax(0, var(--w-measure)) 1fr;
  gap: 16px 24px;
  align-items: end;
}

.eje > * {
  grid-column: 1;
}

.eje-fin {
  grid-column: 2;
  justify-self: end;
  align-self: end;
}

@media (max-width: 767px) {
  .eje {
    grid-template-columns: 1fr;
  }

  .eje-fin {
    grid-column: 1;
    justify-self: start;
  }
}

/* Gutter corto a proposito: mas producto arriba del pliegue (SPEC §4.2) */
.grid-producto {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

@media (min-width: 768px) {
  .grid-producto {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
}

/* ---------- 10j. Card de producto (SPEC §4.2) ---------- */

.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.card-foto {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  aspect-ratio: 3 / 4; /* espacio reservado: CLS bajo 0.1 (SPEC §12) */
  background-color: var(--sahara);
}

/**
 * Cruce a la segunda foto en 300ms. Sin zoom, sin sombra, sin levantar
 * (SPEC §11.3). La segunda foto siempre esta en el DOM y siempre esta cargada:
 * si se montara al pasar el mouse habria un salto en blanco de medio segundo.
 */
.card-foto-2 {
  opacity: 0;
  transition: opacity var(--dur) var(--ease);
}

@media (hover: hover) {
  .card:hover .card-foto-2 {
    opacity: 1;
  }
}

/* En movil no hay hover: el teclado es la unica forma de ver la segunda foto */
.card:focus-visible .card-foto-2 {
  opacity: 1;
}

.card-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-swatches {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

/* 12px, borde Ochre (SPEC §4.2). No son botones: la card entera es el enlace. */
.card-swatch {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  border: 1px solid var(--line);
}
```

- [ ] **Step 2: Escribir la card**

Crear `src/components/producto/CardProducto.tsx`:

```tsx
import Link from 'next/link'
import { FotoFondo } from '@/components/media/FotoFondo'
import { cx, formatCOP } from '@/lib/format'
import type { Producto } from '@/lib/producto-modelo'
import { coloresDe, estadoVisible } from '@/lib/producto-modelo'

/**
 * SPEC §4.2 — card de producto. Imagen 3:4, cruce a la segunda foto en 300ms,
 * nombre, precio y swatches.
 *
 * La card entera es el enlace, asi que los swatches son `<span>`, no botones:
 * un control dentro de otro control no es navegable por teclado y el lector de
 * pantalla lee dos cosas donde hay una.
 *
 * El badge sale del stock, no de un campo del archivo: "ultimas unidades" tiene
 * que ser cierto (SPEC §7). Nunca porcentajes, nunca rojo.
 */

const BADGE: Record<string, { texto: string; solido: boolean } | null> = {
  activo: null,
  ultimas: { texto: 'Ultimas unidades', solido: false },
  agotado: { texto: 'Agotado', solido: true },
  proximamente: { texto: 'Proximamente', solido: false },
}

export function CardProducto({ producto }: { producto: Producto }) {
  const colores = coloresDe(producto)
  const fotos = producto.imagenes[colores[0].nombre] ?? []
  const badge = BADGE[estadoVisible(producto)]

  return (
    <Link href={`/${producto.categoria}/${producto.slug}`} className="card">
      <div className="card-foto">
        <FotoFondo
          nombre={fotos[0]}
          anchos={[900]}
          ancho={900}
          alto={1200}
          sizes="(min-width: 768px) 33vw, 50vw"
          alt={producto.seo.alt}
        />
        {fotos[1] && (
          <FotoFondo
            nombre={fotos[1]}
            anchos={[900]}
            ancho={900}
            alto={1200}
            sizes="(min-width: 768px) 33vw, 50vw"
            // Es la misma prenda en otra toma: describirla otra vez solo repite
            // el mismo texto en el lector de pantalla.
            alt=""
            className="card-foto-2"
          />
        )}
        {badge && (
          <span className={cx('badge card-badge', badge.solido && 'badge-solid')}>
            {badge.texto}
          </span>
        )}
      </div>

      <div className="card-info">
        <h3 className="card-name">{producto.nombre}</h3>
        <p className="price-sm">{formatCOP(producto.precio)}</p>
        <ul className="card-swatches" aria-label={`Colores: ${colores.map((c) => c.nombre).join(', ')}`}>
          {colores.map((color) => (
            <li key={color.nombre}>
              <span className="card-swatch" style={{ backgroundColor: color.hex }} />
            </li>
          ))}
        </ul>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Escribir la grilla presentacional**

Crear `src/components/producto/GridProducto.tsx`:

```tsx
import type { Producto } from '@/lib/producto-modelo'
import { CardProducto } from './CardProducto'

/**
 * La grilla, y nada mas. No tiene estado ni `'use client'` a proposito: es la
 * que renderiza el servidor, la que ve Google y la que queda en pantalla cuando
 * no hay JavaScript (SPEC §9.5, §12).
 *
 * El filtrado y el "Cargar mas" viven en `GridFiltrado`, que la reutiliza.
 */
export function GridProducto({ productos }: { productos: Producto[] }) {
  return (
    <ul className="grid-producto">
      {productos.map((producto) => (
        <li key={producto.slug}>
          <CardProducto producto={producto} />
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Añadir la card a la página de sistema**

En `src/app/(tienda)/sistema/page.tsx`:

1. Añadir a los imports:

```tsx
import { GridProducto } from '@/components/producto/GridProducto'
import { destacados } from '@/lib/productos'
```

2. Convertir el componente de página en `async`:

```tsx
export default async function SistemaPage() {
  const muestraProductos = await destacados(3)
  return (
```

3. Insertar este bloque **después** del último `</Bloque>` (hoy el 10, "Superficies") y antes del `</div>` que cierra `.sistema`:

```tsx
      {/* ---------------- Card de producto ---------------- */}
      <Bloque numero="11" titulo="Card de producto">
        <Muestra nota="Imagen 3:4, cruce a la segunda foto en 300ms al pasar el mouse o al enfocar con teclado. Sin zoom, sin sombra, sin levantar. El badge sale del stock, no de un campo del archivo.">
          <GridProducto productos={muestraProductos} />
        </Muestra>
      </Bloque>
```

- [ ] **Step 5: Verificar en el navegador**

```bash
npm run dev
```

Abrir `http://localhost:3000/sistema` y comprobar, en el bloque 11:
1. Tres cards en tres columnas, con relación 3:4 y gutter corto.
2. Al pasar el mouse sobre una, la imagen cruza a la de fondo Cream en ~300ms. Sin zoom, sin sombra, sin desplazamiento.
3. Al tabular hasta una card, el foco es un contorno Ochre visible y también cruza la imagen.
4. El precio se lee `$145.000`.
5. Ninguna card tiene badge (los tres destacados están activos). Para verificar el badge, cambiar temporalmente en `productos.json` el `stock` de `LEG-DUN-S` a `0` y ver aparecer `Ultimas unidades` en outline — **revertir el cambio después**.

- [ ] **Step 6: Lint, build y commit**

```bash
npm run lint && npm run build
git add src/app/globals.css src/components/producto/CardProducto.tsx src/components/producto/GridProducto.tsx "src/app/(tienda)/sistema/page.tsx"
git commit -m "$(cat <<'EOF'
feat(producto): utilidades de composicion y card de producto

.a-sangre y .eje son la base de todo lo visual que viene. La card es la
pieza que mas se repite: catalogo, destacados y "completa el look". El
badge se calcula del stock para que "ultimas unidades" sea cierto.

Verificable en /sistema, bloque 11.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 5: Catálogo — rutas, encabezado, grilla y "Cargar más"

Las tres rutas de categoría más `/colecciones`. La grilla la renderiza el servidor completa (SEO y sin-JS); `GridFiltrado` la reemplaza en cliente ya leyendo la URL, aunque la barra de filtros no exista todavía — se verifica escribiendo los parámetros a mano.

**Por qué se construye `/colecciones`:** el spec de diseño manda que el "Ver todo" de los destacados lleve ahí (§3, bloque 5). Sin la ruta, el enlace principal de la home cae en el 404. Es la misma plantilla sin filtro de categoría.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/copy.ts`
- Create: `src/components/producto/GridFiltrado.tsx`
- Create: `src/components/producto/Catalogo.tsx`
- Create: `src/app/(tienda)/[categoria]/page.tsx`
- Create: `src/app/(tienda)/colecciones/page.tsx`

**Interfaces:**
- Consumes: `GridProducto` (tarea 4), `listarProductos` (tarea 1), `leerFiltros`/`aplicarFiltros`/`opcionesDe` (tarea 2), `TrazoColumna`, `Boton`, `Reveal`.
- Produce:
  - `GridFiltrado({ productos, porPagina? }: { productos: Producto[]; porPagina?: number })` — Client Component, `porPagina` por defecto 6
  - `Catalogo({ titulo, intro, productos }: { titulo: string; intro: string; productos: Producto[] })` — Server Component. En la tarea 6 gana el `<Filtros>`
  - Rutas `/leggings`, `/tops`, `/sets`, `/colecciones`

**Nota sobre `output: 'export'`.** No se puede leer `searchParams` en servidor: con export estático la página se prerenderiza una sola vez y Next falla el build si se accede. Por eso el filtrado es cliente. Para que el HTML estático siga trayendo el catálogo entero, `GridFiltrado` va dentro de un `<Suspense>` cuyo **fallback es la grilla completa renderizada en servidor**. Sin JavaScript ese fallback nunca se reemplaza: la clienta y Google ven las ocho referencias.

- [ ] **Step 1: Añadir el microcopy nuevo**

En `src/lib/copy.ts`, dentro de `microcopy`, después de `verTodo`:

```ts
  cargarMas: 'Cargar mas',
  sinResultados: 'No hay nada con esos filtros.',
  quitarFiltros: 'Quitar filtros',
  filtrar: 'Filtrar',
  ordenar: 'Ordenar',
```

- [ ] **Step 2: Añadir el CSS del catálogo**

En `src/app/globals.css`, después del bloque `10j. Card de producto`:

```css
/* ---------- 10k. Catalogo (SPEC §4.2) ---------- */

.catalogo-head {
  padding-block: 40px 32px;
}

/**
 * El SPEC §11.1 promete que la linea acompana la columna de producto. Aqui baja
 * por el margen izquierdo de la grilla. Solo desde tablet: en movil ese carril
 * le quitaria ancho a la card, que es lo unico que importa en esa pantalla.
 */
.catalogo-cuerpo {
  position: relative;
  padding-bottom: 64px;
}

.catalogo-trazo {
  display: none;
}

@media (min-width: 768px) {
  .catalogo-cuerpo {
    padding-left: 32px;
  }

  .catalogo-trazo {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 64px;
  }
}

/**
 * "Cargar mas" sobre el eje izquierdo, no centrado (spec de diseno §4).
 * Arranca oculto: sin JavaScript la grilla ya esta entera en el HTML y el boton
 * no tendria nada que cargar (SPEC §9.5).
 */
.cargar-mas {
  display: none;
  padding-top: 40px;
}

@media (scripting: enabled) {
  .cargar-mas {
    display: block;
  }
}

.catalogo-vacio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding-block: 64px;
}
```

- [ ] **Step 3: Escribir la grilla filtrada**

Crear `src/components/producto/GridFiltrado.tsx`:

```tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Boton } from '@/components/ui/Button'
import { microcopy } from '@/lib/copy'
import { aplicarFiltros, leerFiltros } from '@/lib/filtros'
import type { Producto } from '@/lib/producto-modelo'
import { GridProducto } from './GridProducto'

/**
 * Aplica a la grilla los filtros que vienen en la URL y pagina con "Cargar mas".
 *
 * Es cliente porque tiene que serlo: el sitio se exporta estatico
 * (`next.config.ts`, `output: 'export'`), asi que no hay `searchParams` en
 * servidor. La pagina lo envuelve en un <Suspense> cuyo fallback es la grilla
 * completa renderizada en servidor; sin JavaScript ese fallback se queda, y con
 * el las ocho referencias en el HTML (SPEC §9.5, §12).
 *
 * Sin scroll infinito, a proposito: impide llegar al footer (SPEC §4.2).
 */
export function GridFiltrado({
  productos,
  porPagina = 6,
}: {
  productos: Producto[]
  porPagina?: number
}) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const clave = params.toString()

  const [paginas, setPaginas] = useState(1)

  // Cambiar un filtro vuelve a la primera pagina: si no, quitar un color puede
  // dejar a la clienta mirando el hueco donde estaba lo que ya habia cargado.
  useEffect(() => {
    setPaginas(1)
  }, [clave])

  const visibles = aplicarFiltros(productos, leerFiltros(params))
  const mostrados = visibles.slice(0, paginas * porPagina)

  if (visibles.length === 0) {
    return (
      <div className="catalogo-vacio">
        <p className="quote">{microcopy.sinResultados}</p>
        <Boton variante="secundario" onClick={() => router.replace(pathname, { scroll: false })}>
          {microcopy.quitarFiltros}
        </Boton>
      </div>
    )
  }

  return (
    <>
      <GridProducto productos={mostrados} />
      {mostrados.length < visibles.length && (
        <div className="cargar-mas">
          <Boton variante="secundario" onClick={() => setPaginas((n) => n + 1)}>
            {microcopy.cargarMas}
          </Boton>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Escribir la plantilla de catálogo**

Crear `src/components/producto/Catalogo.tsx`:

```tsx
import { Suspense } from 'react'
import { TrazoColumna } from '@/components/motion/Trazo'
import { Reveal } from '@/components/motion/Reveal'
import type { Producto } from '@/lib/producto-modelo'
import { GridFiltrado } from './GridFiltrado'
import { GridProducto } from './GridProducto'

/**
 * La plantilla del catalogo, compartida por /leggings, /tops, /sets y
 * /colecciones. Server Component: el HTML sale con todas las referencias
 * dentro, que es de donde sale el SEO (SPEC §9.5).
 *
 * El encabezado va sobre el eje izquierdo (§11.2). La referencia lo centra;
 * aqui no: centrar es el reflejo automatico de cualquier plantilla.
 */
export function Catalogo({
  titulo,
  intro,
  productos,
}: {
  titulo: string
  intro: string
  productos: Producto[]
}) {
  return (
    <div className="container-nude">
      <header className="catalogo-head eje">
        <Reveal>
          <h1 className="display-l">{titulo}</h1>
        </Reveal>
        <Reveal delay={80}>
          <p className="body measure text-muted">{intro}</p>
        </Reveal>
      </header>

      <div className="catalogo-cuerpo">
        <div className="catalogo-trazo" aria-hidden="true">
          <TrazoColumna alto="100%" />
        </div>

        {/*
          El fallback NO es un esqueleto: es la grilla entera renderizada en
          servidor. Con export estatico es lo que queda en el HTML, asi que sin
          JavaScript la clienta ve el catalogo completo en vez de un hueco.
        */}
        <Suspense fallback={<GridProducto productos={productos} />}>
          <GridFiltrado productos={productos} />
        </Suspense>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Escribir la ruta de categoría**

Crear `src/app/(tienda)/[categoria]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Catalogo } from '@/components/producto/Catalogo'
import { CATEGORIAS, INTRO_CATEGORIA, NOMBRE_CATEGORIA, esCategoria } from '@/lib/producto-modelo'
import { listarProductos } from '@/lib/productos'

/**
 * Catalogo por categoria: /leggings, /tops, /sets.
 *
 * `dynamicParams = false` mas `generateStaticParams` es lo que hace posible la
 * ruta dinamica con `output: 'export'`: se prerenderizan exactamente tres
 * paginas y cualquier otro segmento cae en el 404, en vez de intentar
 * renderizarse en un servidor que no existe.
 *
 * Los segmentos estaticos hermanos (/sistema, /colecciones) ganan sobre este:
 * Next resuelve primero la ruta literal.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria }))
}

type Props = { params: Promise<{ categoria: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params
  if (!esCategoria(categoria)) return {}
  return {
    title: NOMBRE_CATEGORIA[categoria],
    description: INTRO_CATEGORIA[categoria],
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params
  if (!esCategoria(categoria)) notFound()

  const { productos } = await listarProductos({ categoria })

  return (
    <Catalogo
      titulo={NOMBRE_CATEGORIA[categoria]}
      intro={INTRO_CATEGORIA[categoria]}
      productos={productos}
    />
  )
}
```

- [ ] **Step 6: Escribir la ruta de colecciones**

Crear `src/app/(tienda)/colecciones/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Catalogo } from '@/components/producto/Catalogo'
import { listarProductos } from '@/lib/productos'

/**
 * Todo el catalogo en una pagina. Es el destino de "Ver todo" en los destacados
 * de la home y de la entrada "Colecciones" del menu, que hasta ahora caia en el
 * 404 (ver README, fase 1).
 *
 * TODO(decision-abierta-4): cuando la primera coleccion tenga nombre propio,
 * esto pasa a ser una portada editorial y el catalogo completo se queda debajo.
 */
const INTRO =
  'Toda la coleccion Primera Piel: leggings, tops y sets en tonos tierra. Disenada para moverte, hecha para quedarse.'

export const metadata: Metadata = {
  title: 'Colecciones',
  description: INTRO,
}

export default async function ColeccionesPage() {
  const { productos } = await listarProductos()
  return <Catalogo titulo="Colecciones" intro={INTRO} productos={productos} />
}
```

- [ ] **Step 7: Verificar en el navegador**

```bash
npm run dev
```

1. `http://localhost:3000/leggings` — encabezado sobre el eje izquierdo (título y párrafo alineados a la izquierda, no centrados), tres cards, línea Ochre bajando por el margen izquierdo de la grilla desde 768px.
2. `http://localhost:3000/colecciones` — seis cards y el botón "Cargar mas"; al pulsarlo aparecen las dos restantes y el botón desaparece.
3. `http://localhost:3000/colecciones?color=Arena` — tres cards.
4. `http://localhost:3000/colecciones?orden=precio-asc` — la primera card es Top Brisa, `$98.000`.
5. `http://localhost:3000/colecciones?color=Duna&talla=XL` — estado vacío con "No hay nada con esos filtros." y el botón "Quitar filtros", que devuelve a `/colecciones` con las ocho.
6. `http://localhost:3000/nosotros` — sigue cayendo en el 404 diseñado (no lo captura `[categoria]`).
7. `http://localhost:3000/sistema` — sigue funcionando.
8. Con JavaScript desactivado en el navegador, `http://localhost:3000/colecciones` muestra las **ocho** cards y **ningún** botón "Cargar mas".

- [ ] **Step 8: Verificar el export estático**

```bash
npm run build
ls out/leggings.html out/tops.html out/sets.html out/colecciones.html
grep -c 'class="card"' out/colecciones.html
```

Expected: los cuatro HTML existen y `grep` cuenta **8**. Si cuenta 0, el fallback del `<Suspense>` no se está prerenderizando y el SEO está roto: revisar que el fallback sea `<GridProducto productos={productos} />` y no un esqueleto.

- [ ] **Step 9: Lint y commit**

```bash
npm run lint
git add src/app/globals.css src/lib/copy.ts src/components/producto/GridFiltrado.tsx src/components/producto/Catalogo.tsx "src/app/(tienda)/[categoria]" "src/app/(tienda)/colecciones"
git commit -m "$(cat <<'EOF'
feat(catalogo): rutas de categoria, colecciones y grilla paginada

El servidor renderiza la grilla completa y el cliente la reemplaza ya
filtrada: el fallback del Suspense es la grilla entera, asi que sin
JavaScript queda el catalogo completo en el HTML.

Se construye /colecciones porque es el destino del "Ver todo" de la home;
sin ella ese enlace caia en el 404.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 6: Catálogo — barra de filtros

Los filtros son obligatorios desde el día uno (SPEC §4.2). El estado ya vive en la URL desde la tarea 2; aquí se construye el control.

**Files:**
- Modify: `src/components/ui/Panel.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/producto/Filtros.tsx`
- Modify: `src/components/producto/Catalogo.tsx`

**Interfaces:**
- Consumes: `leerFiltros`, `escribirFiltros`, `opcionesDe`, `cuantosActivos`, `FiltrosActivos` (tarea 2); `Swatch`, `BotonTalla`, `CampoTexto`, `CampoLista`, `Boton`, `Panel`.
- Produce: `Filtros({ opciones }: { opciones: OpcionesFiltro })` — Client Component.

**Desviación documentada.** El spec de diseño §2.4 dice que `drawer` se reutiliza «tal cual, sin modificar», y a la vez el §4 pide que en móvil los filtros abran un **panel inferior**. Se resuelve añadiendo `lado="abajo"` como variante nueva: los tres usos existentes (`derecha`, `izquierda`) no cambian de comportamiento ni de CSS.

- [ ] **Step 1: Añadir la variante inferior al panel**

En `src/components/ui/Panel.tsx`, cambiar el tipo de `lado`:

```tsx
  lado?: 'izquierda' | 'derecha' | 'abajo'
```

No hay que tocar nada más: `cx('drawer', `drawer-${lado}`, ...)` ya compone la clase.

En `src/app/globals.css`, dentro de `@layer components`, justo después del bloque `.drawer-izquierda`:

```css
  /**
   * Panel inferior: la variante de movil para los filtros del catalogo. El
   * pulgar llega antes al borde de abajo que al lateral, y el catalogo se sigue
   * viendo detras mientras se filtra.
   */
  .drawer-abajo {
    top: auto;
    right: 0;
    left: 0;
    bottom: 0;
    width: 100vw;
    height: auto;
    max-height: 85dvh;
    border-top: 1px solid var(--line-soft);
    translate: 0 100%;
  }
```

Y añadir la regla de entrada junto a las otras dos de `@starting-style`:

```css
    .drawer-abajo[open] {
      translate: 0 100%;
    }
```

- [ ] **Step 2: Añadir el CSS de la barra de filtros**

En `src/app/globals.css`, después del bloque `10k. Catalogo`:

```css
/* ---------- 10l. Barra de filtros (SPEC §4.2) ---------- */

/**
 * Pegajosa bajo el header fijo. El offset depende de si la franja de anuncio
 * esta encendida, igual que `.con-header` / `.con-anuncio` en el layout.
 */
.barra-filtros {
  position: sticky;
  top: var(--header-h);
  z-index: 40;
  background-color: var(--bg);
  border-block: 1px solid var(--line-soft);
  padding-block: 10px;
}

.con-anuncio .barra-filtros {
  top: calc(var(--header-h) + var(--anuncio-h));
}

.barra-filtros-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

/* Grupo de una dimension: etiqueta arriba, controles debajo */
.filtro-grupo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filtro-grupo-titulo {
  color: var(--text-muted);
  white-space: nowrap;
}

.filtro-controles {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.filtro-precio {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.filtro-precio .input {
  width: 110px;
}

/* En el panel de movil cada dimension va apilada y con aire */
.filtro-panel {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.filtro-panel .filtro-grupo {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

/* Debajo de 1024px las cuatro dimensiones no caben en una fila legible:
   el detalle se va al panel inferior y en la barra queda el disparador. */
.filtros-desktop {
  display: none;
}

@media (min-width: 1024px) {
  .filtros-desktop {
    display: flex;
    align-items: center;
    gap: 28px;
    flex-wrap: wrap;
  }

  .filtros-movil {
    display: none;
  }
}

.filtros-conteo {
  color: var(--text-muted);
  white-space: nowrap;
}
```

- [ ] **Step 3: Escribir el componente de filtros**

Crear `src/components/producto/Filtros.tsx`:

```tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Boton } from '@/components/ui/Button'
import { CampoLista, CampoTexto } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { BotonTalla, Swatch } from '@/components/ui/Selectores'
import { microcopy } from '@/lib/copy'
import type { FiltrosActivos, OpcionesFiltro } from '@/lib/filtros'
import { cuantosActivos, escribirFiltros, leerFiltros } from '@/lib/filtros'
import type { Orden, Talla } from '@/lib/producto-modelo'

/**
 * SPEC §4.2 — Color · Talla · Precio · Ordenar, en barra pegajosa bajo el
 * header. En movil abre panel inferior.
 *
 * Todo el estado vive en la URL, no en `useState`: asi un filtro se comparte por
 * WhatsApp y el boton atras del navegador funciona. `router.replace` en vez de
 * `push` para que atras salga del catalogo en un toque en vez de deshacer filtro
 * a filtro.
 *
 * Desde 1024px las cuatro dimensiones se ven enteras en la barra: con cuatro
 * colores y cinco tallas, un desplegable esconde mas de lo que ordena. Debajo de
 * ese ancho no caben y el detalle se va al panel.
 */
export function Filtros({ opciones }: { opciones: OpcionesFiltro }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [panelAbierto, setPanelAbierto] = useState(false)

  const filtros = leerFiltros(params)
  const activos = cuantosActivos(filtros)

  function aplicar(cambio: Partial<FiltrosActivos>) {
    const query = escribirFiltros({ ...filtros, ...cambio })
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function alternar<T extends string>(lista: T[], valor: T): T[] {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
  }

  const controles = (
    <>
      <div className="filtro-grupo">
        <span className="label filtro-grupo-titulo">Color</span>
        <div className="filtro-controles">
          {opciones.colores.map((color) => (
            <Swatch
              key={color.nombre}
              nombre={color.nombre}
              hex={color.hex}
              seleccionado={filtros.colores.includes(color.nombre)}
              onClick={() => aplicar({ colores: alternar(filtros.colores, color.nombre) })}
            />
          ))}
        </div>
      </div>

      <div className="filtro-grupo">
        <span className="label filtro-grupo-titulo">Talla</span>
        <div className="filtro-controles">
          {opciones.tallas.map((talla) => (
            <BotonTalla
              key={talla}
              talla={talla}
              seleccionada={filtros.tallas.includes(talla)}
              onClick={() => aplicar({ tallas: alternar<Talla>(filtros.tallas, talla) })}
            />
          ))}
        </div>
      </div>

      <div className="filtro-grupo">
        <span className="label filtro-grupo-titulo">Precio</span>
        <div className="filtro-precio">
          <CampoTexto
            id="filtro-min"
            label="Desde"
            type="number"
            inputMode="numeric"
            min={opciones.precio.min}
            max={opciones.precio.max}
            step={1000}
            value={filtros.precio.min ?? ''}
            onChange={(e) =>
              aplicar({
                precio: { ...filtros.precio, min: e.target.value ? Number(e.target.value) : undefined },
              })
            }
          />
          <CampoTexto
            id="filtro-max"
            label="Hasta"
            type="number"
            inputMode="numeric"
            min={opciones.precio.min}
            max={opciones.precio.max}
            step={1000}
            value={filtros.precio.max ?? ''}
            onChange={(e) =>
              aplicar({
                precio: { ...filtros.precio, max: e.target.value ? Number(e.target.value) : undefined },
              })
            }
          />
        </div>
      </div>

      <div className="filtro-grupo">
        <CampoLista
          id="filtro-orden"
          label={microcopy.ordenar}
          value={filtros.orden}
          onChange={(e) => aplicar({ orden: e.target.value as Orden })}
        >
          <option value="novedad">Novedad</option>
          <option value="precio-asc">Precio, de menor a mayor</option>
          <option value="precio-desc">Precio, de mayor a menor</option>
        </CampoLista>
      </div>
    </>
  )

  return (
    <div className="barra-filtros">
      <div className="container-nude barra-filtros-inner">
        <div className="filtros-desktop">{controles}</div>

        <div className="filtros-movil">
          <Boton variante="secundario" onClick={() => setPanelAbierto(true)}>
            {activos ? `${microcopy.filtrar} (${activos})` : microcopy.filtrar}
          </Boton>
        </div>

        {activos > 0 && (
          <Boton
            variante="secundario"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            {microcopy.quitarFiltros}
          </Boton>
        )}
      </div>

      <Panel
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        titulo="Filtrar y ordenar"
        lado="abajo"
        pie={
          <Boton ancho onClick={() => setPanelAbierto(false)}>
            Ver productos
          </Boton>
        }
      >
        <div className="filtro-panel">{controles}</div>
      </Panel>
    </div>
  )
}
```

- [ ] **Step 4: Conectar los filtros al catálogo**

En `src/components/producto/Catalogo.tsx`:

1. Añadir a los imports:

```tsx
import { opcionesDe } from '@/lib/filtros'
import { Filtros } from './Filtros'
```

2. Calcular las opciones dentro del componente, antes del `return`:

```tsx
  const opciones = opcionesDe(productos)
```

3. Sacar la barra fuera del `container-nude` — es pegajosa a ancho completo — y envolverla en su propio `<Suspense>`. El `return` queda así:

```tsx
  return (
    <>
      <div className="container-nude">
        <header className="catalogo-head eje">
          <Reveal>
            <h1 className="display-l">{titulo}</h1>
          </Reveal>
          <Reveal delay={80}>
            <p className="body measure text-muted">{intro}</p>
          </Reveal>
        </header>
      </div>

      {/*
        Fallback `null` a proposito: sin JavaScript un filtro no puede hacer
        nada, asi que la barra no debe ocupar sitio. Lo que si tiene que quedar
        en el HTML es la grilla, y esa tiene su propio fallback mas abajo.
      */}
      <Suspense fallback={null}>
        <Filtros opciones={opciones} />
      </Suspense>

      <div className="container-nude">
        <div className="catalogo-cuerpo">
          <div className="catalogo-trazo" aria-hidden="true">
            <TrazoColumna alto="100%" />
          </div>

          <Suspense fallback={<GridProducto productos={productos} />}>
            <GridFiltrado productos={productos} />
          </Suspense>
        </div>
      </div>
    </>
  )
```

- [ ] **Step 5: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000/colecciones`, a 1440px:
1. La barra de filtros queda pegada bajo el header al hacer scroll, sin taparlo ni dejar hueco.
2. Pulsar el swatch Arena: la URL pasa a `?color=Arena`, la grilla baja a tres, el swatch queda con anillo Umber.
3. Pulsar el botón atrás: vuelve a las ocho y el swatch se apaga.
4. Escribir 200000 en "Desde": la URL suma `min=200000` y quedan los dos sets.
5. Cambiar "Ordenar" a "Precio, de menor a mayor": la URL suma `orden=precio-asc`.
6. "Quitar filtros" devuelve a `/colecciones` limpio.
7. Copiar `http://localhost:3000/colecciones?color=Arena&talla=S` en una pestaña nueva: carga ya filtrado.
8. Tabular por la barra: cada swatch y cada botón de talla recibe foco Ochre visible.

A 390px:
9. La barra muestra solo el botón "Filtrar"; al pulsarlo entra un panel desde abajo con las cuatro dimensiones apiladas.
10. El panel se cierra con Esc, con la X y tocando fuera; los filtros elegidos se quedan aplicados.
11. Sin scroll horizontal en ningún punto.

- [ ] **Step 6: Lint, build y commit**

```bash
npm run lint && npm run build
git add src/components/ui/Panel.tsx src/app/globals.css src/components/producto/Filtros.tsx src/components/producto/Catalogo.tsx
git commit -m "$(cat <<'EOF'
feat(catalogo): barra de filtros con estado en la URL

Color, talla, precio y orden. Pegajosa bajo el header en desktop, panel
inferior en movil. El estado vive en la URL: un filtro se comparte y el
boton atras funciona.

Panel gana la variante lado="abajo"; los usos existentes no cambian.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 7: Ficha — ruta, estado de variante y galería

La página más importante del sitio. Esta tarea deja la ruta en pie con la galería funcionando y el trazo bajando por la columna de compra; el bloque de compra llega en la 8.

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/producto/Variante.tsx`
- Create: `src/components/producto/Galeria.tsx`
- Create: `src/components/producto/MigaDePan.tsx`
- Create: `src/app/(tienda)/[categoria]/[slug]/page.tsx`

**Interfaces:**
- Consumes: `obtenerProducto`, `listarProductos`; `coloresDe`, `tallasDe`, `stockDe`, `varianteDe`, `NOMBRE_CATEGORIA`; `FotoFondo`, `TrazoColumna`, `CaretRight`.
- Produce:
  - `VarianteProvider({ producto, children })` — Client Component
  - `useVariante(): ContextoVariante` con `{ producto, colores, tallas, color, talla, imagenes, variante, elegirColor, elegirTalla, stockDeTalla, confirmado, agregar, cerrarConfirmacion }` — lo usan las tareas 8 y 9
  - `Galeria({ alt }: { alt: string })` — Client Component
  - `MigaDePan({ categoria, nombre }: { categoria: Categoria; nombre: string })` — Server Component
  - Ruta `/[categoria]/[slug]`

- [ ] **Step 1: Añadir el CSS de la ficha y la galería**

En `src/app/globals.css`, después del bloque `10l. Barra de filtros`:

```css
/* ---------- 10m. Ficha de producto (SPEC §4.3) ---------- */

.ficha-pagina {
  padding-bottom: 64px;
}

.miga {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
  padding-block: 20px 24px;
}

.miga li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.miga svg {
  flex: none;
  color: var(--line);
}

.ficha {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.ficha-compra {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 1024px) {
  .ficha {
    grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
    gap: 56px;
    align-items: start;
  }

  /* Pegajosa: la foto es larga y el boton no puede irse de pantalla (SPEC §4.3) */
  .ficha-compra {
    position: sticky;
    top: calc(var(--header-h) + 24px);
    padding-left: 32px;
  }

  .con-anuncio .ficha-compra {
    top: calc(var(--header-h) + var(--anuncio-h) + 24px);
  }
}

/**
 * SPEC §11.1 — en la ficha la linea conecta la galeria con el bloque de compra:
 * la mirada la sigue de la foto al boton. Solo existe cuando hay dos columnas;
 * en movil no hay nada que conectar porque van una debajo de otra.
 */
.ficha-trazo {
  display: none;
}

@media (min-width: 1024px) {
  .ficha-trazo {
    display: block;
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
  }
}

/* SPEC §4.3 — nombre en Cormorant 400, 28px */
.ficha-nombre {
  font-family: var(--font-cormorant), ui-serif, Georgia, serif;
  font-weight: 400;
  font-size: 28px;
  line-height: 1.2;
}

.ficha-sku {
  font-family: var(--font-jost), ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

.ficha-bloque {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ficha-opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ficha-color-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.ficha-inventario {
  color: var(--text-muted);
}

.ficha-detalles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
}

/* ---------- 10n. Galeria (SPEC §4.3) ---------- */

.galeria {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Movil: carrusel a ancho completo con puntos. Desktop: una sola foto grande. */
.galeria-vista {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  list-style: none;
  margin: 0;
  padding: 0;
}

.galeria-vista::-webkit-scrollbar {
  display: none;
}

.galeria-vista > li {
  position: relative;
  flex: 0 0 100%;
  scroll-snap-align: center;
  aspect-ratio: 3 / 4;
  background-color: var(--sahara);
}

.galeria-puntos {
  display: flex;
  justify-content: center;
  gap: 0;
}

/* 44x44 real alrededor de un punto de 6px (SPEC §12) */
.punto {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
}

.punto span {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: var(--line-soft);
  transition: background-color var(--dur-fast) var(--ease);
}

.punto[aria-current="true"] span {
  background-color: var(--umber);
}

.galeria-minis {
  display: none;
  flex-direction: column;
  gap: 8px;
  flex: none;
  width: 76px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.mini {
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background-color: var(--sahara);
}

.mini[aria-pressed="true"] {
  border-color: var(--umber);
}

@media (min-width: 768px) {
  .galeria {
    flex-direction: row-reverse;
    align-items: flex-start;
    gap: 12px;
  }

  .galeria-principal {
    flex: 1;
    min-width: 0;
  }

  .galeria-vista {
    flex-direction: column;
    overflow: visible;
    gap: 12px;
  }

  .galeria-puntos {
    display: none;
  }
}

/**
 * "Una sola foto grande + miniaturas" es estado de interfaz. Sin JavaScript no
 * hay nada que cambiar, asi que la galeria se queda como una columna con las
 * cuatro fotos: entera, sin nada escondido (SPEC §9.5).
 */
@media (min-width: 768px) and (scripting: enabled) {
  .galeria-vista {
    display: block;
  }

  .galeria-vista > li[data-activa="false"] {
    display: none;
  }

  .galeria-minis {
    display: flex;
  }
}
```

- [ ] **Step 2: Escribir el contexto de variante**

Crear `src/components/producto/Variante.tsx`:

```tsx
'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Producto, Talla, Variante } from '@/lib/producto-modelo'
import { coloresDe, stockDe, tallasDe, varianteDe } from '@/lib/producto-modelo'

/**
 * Color y talla elegidos en la ficha. Es el unico estado con el que la clienta
 * juega antes de comprar, y tres piezas separadas dependen de el: la galeria (a
 * la izquierda), los selectores (a la derecha) y la barra de compra (abajo, en
 * movil).
 *
 * Va por contexto y no por props para no tener que convertir toda la ficha en un
 * Client Component: el proveedor envuelve las dos columnas y los hijos de
 * servidor pasan por `children` ya renderizados. Es el mismo patron que
 * `BuscadorProvider` en el header.
 */

type ContextoVariante = {
  producto: Producto
  colores: { nombre: string; hex: string }[]
  tallas: Talla[]
  color: string
  /** null hasta que la clienta elige. Nunca se preselecciona una talla. */
  talla: Talla | null
  /** Fotos del color activo. */
  imagenes: string[]
  variante: Variante | null
  elegirColor: (color: string) => void
  elegirTalla: (talla: Talla) => void
  stockDeTalla: (talla: Talla) => number
  /**
   * Panel de confirmacion del SPEC §4.4. El estado vive aqui porque lo disparan
   * DOS botones: el de la columna de compra y el de la barra fija de movil, que
   * en movil se ven a la vez. Dos <dialog> con el mismo contenido serian dos
   * trampas de foco compitiendo — el mismo motivo por el que el buscador del
   * header tiene un solo panel y dos disparadores.
   */
  confirmado: boolean
  agregar: () => void
  cerrarConfirmacion: () => void
}

const Ctx = createContext<ContextoVariante | null>(null)

export function VarianteProvider({
  producto,
  children,
}: {
  producto: Producto
  children: ReactNode
}) {
  const colores = useMemo(() => coloresDe(producto), [producto])
  const tallas = useMemo(() => tallasDe(producto), [producto])

  const [color, setColor] = useState(colores[0].nombre)
  const [talla, setTalla] = useState<Talla | null>(null)
  const [confirmado, setConfirmado] = useState(false)

  const valor = useMemo<ContextoVariante>(
    () => ({
      producto,
      colores,
      tallas,
      color,
      talla,
      imagenes: producto.imagenes[color] ?? [],
      variante: talla ? varianteDe(producto, color, talla) : null,
      elegirColor: (nuevo) => {
        setColor(nuevo)
        // La talla se conserva solo si el color nuevo la tiene. Dejarla puesta
        // sin stock haria que el boton de comprar mintiera.
        setTalla((actual) => (actual && stockDe(producto, nuevo, actual) > 0 ? actual : null))
      },
      elegirTalla: setTalla,
      stockDeTalla: (t) => stockDe(producto, color, t),
      confirmado,
      agregar: () => setConfirmado(true),
      cerrarConfirmacion: () => setConfirmado(false),
    }),
    [producto, colores, tallas, color, talla, confirmado],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useVariante(): ContextoVariante {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVariante necesita estar dentro de VarianteProvider')
  return ctx
}
```

- [ ] **Step 3: Escribir la galería**

Crear `src/components/producto/Galeria.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { FotoFondo } from '@/components/media/FotoFondo'
import { useVariante } from './Variante'

/**
 * SPEC §4.3 — miniaturas verticales mas imagen principal en escritorio; en movil,
 * carrusel a ancho completo con puntos.
 *
 * Es el mismo marcado en los dos casos y lo resuelve el CSS: en movil la lista es
 * un carril con scroll-snap y en escritorio se esconde todo menos la foto activa.
 * Dos marcados distintos significarian descargar las fotos dos veces.
 */
export function Galeria({ alt }: { alt: string }) {
  const { imagenes, color } = useVariante()
  const [activa, setActiva] = useState(0)
  const pista = useRef<HTMLUListElement>(null)

  // Cambiar de color cambia el juego de fotos: la cuarta del anterior puede no
  // existir en el nuevo.
  useEffect(() => {
    setActiva(0)
    pista.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [color])

  function irA(i: number) {
    setActiva(i)
    const el = pista.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: i * el.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  return (
    <div className="galeria">
      <div className="galeria-principal">
        <ul
          ref={pista}
          className="galeria-vista"
          onScroll={(e) => {
            const el = e.currentTarget
            // En escritorio el carril no desplaza: sin esta guarda, cualquier
            // scroll de la pagina devolveria la foto activa a la primera.
            if (el.scrollWidth <= el.clientWidth || !el.clientWidth) return
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== activa) setActiva(i)
          }}
        >
          {imagenes.map((foto, i) => (
            <li key={foto + i} data-activa={i === activa}>
              <FotoFondo
                nombre={foto}
                anchos={[900]}
                ancho={900}
                alto={1200}
                sizes="(min-width: 1024px) 50vw, 100vw"
                prioridad={i === 0}
                alt={`${alt}. Imagen ${i + 1} de ${imagenes.length}`}
              />
            </li>
          ))}
        </ul>

        <div className="galeria-puntos">
          {imagenes.map((foto, i) => (
            <button
              key={foto + i}
              type="button"
              className="punto"
              aria-current={i === activa}
              aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
              onClick={() => irA(i)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>

      <ul className="galeria-minis">
        {imagenes.map((foto, i) => (
          <li key={foto + i}>
            <button
              type="button"
              className="mini"
              aria-pressed={i === activa}
              aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
              onClick={() => irA(i)}
            >
              <FotoFondo
                nombre={foto}
                anchos={[900]}
                ancho={900}
                alto={1200}
                sizes="76px"
                alt=""
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Escribir la miga de pan**

Crear `src/components/producto/MigaDePan.tsx`:

```tsx
import Link from 'next/link'
import { CaretRight } from '@/components/ui/icons'
import type { Categoria } from '@/lib/producto-modelo'
import { NOMBRE_CATEGORIA } from '@/lib/producto-modelo'

/**
 * Aporte de la referencia: es SEO y es la salida de quien cae aqui desde Google
 * sin haber pasado por la home.
 *
 * Va sobre las dos columnas y no dentro de la de compra: en movil las columnas se
 * apilan y la miga acabaria despues de la galeria, que es justo donde ya no
 * sirve para orientarse.
 */
export function MigaDePan({ categoria, nombre }: { categoria: Categoria; nombre: string }) {
  return (
    <nav aria-label="Miga de pan">
      <ol className="miga body-s text-muted">
        <li>
          <Link href="/" className="link-nav">
            Inicio
          </Link>
          <CaretRight size={12} weight="light" aria-hidden="true" />
        </li>
        <li>
          <Link href={`/${categoria}`} className="link-nav">
            {NOMBRE_CATEGORIA[categoria]}
          </Link>
          <CaretRight size={12} weight="light" aria-hidden="true" />
        </li>
        <li aria-current="page">{nombre}</li>
      </ol>
    </nav>
  )
}
```

- [ ] **Step 5: Escribir la ruta de ficha**

Crear `src/app/(tienda)/[categoria]/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrazoColumna } from '@/components/motion/Trazo'
import { Galeria } from '@/components/producto/Galeria'
import { MigaDePan } from '@/components/producto/MigaDePan'
import { VarianteProvider } from '@/components/producto/Variante'
import { formatCOP } from '@/lib/format'
import { esCategoria } from '@/lib/producto-modelo'
import { listarProductos, obtenerProducto } from '@/lib/productos'

/**
 * Ficha de producto. La pagina mas importante del sitio: aqui se decide la
 * compra (SPEC §4.3).
 *
 * `generateStaticParams` devuelve los dos segmentos desde la hoja, que es lo que
 * permite prerenderizar las ocho fichas con `output: 'export'`.
 */
export const dynamicParams = false

export async function generateStaticParams() {
  const { productos } = await listarProductos()
  return productos.map((p) => ({ categoria: p.categoria, slug: p.slug }))
}

type Props = { params: Promise<{ categoria: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const producto = await obtenerProducto(slug)
  if (!producto) return {}
  return {
    title: producto.seo.titulo,
    description: producto.seo.descripcion,
    openGraph: { title: producto.seo.titulo, description: producto.seo.descripcion },
  }
}

export default async function FichaPage({ params }: Props) {
  const { categoria, slug } = await params
  const producto = await obtenerProducto(slug)

  // El slug manda sobre el segmento de categoria: /tops/legging-duna no existe.
  if (!producto || !esCategoria(categoria) || producto.categoria !== categoria) notFound()

  return (
    <article className="container-nude ficha-pagina">
      <MigaDePan categoria={producto.categoria} nombre={producto.nombre} />

      <VarianteProvider producto={producto}>
        <div className="ficha">
          <div className="ficha-galeria">
            <Galeria alt={producto.seo.alt} />
          </div>

          <div className="ficha-compra">
            {/* El trazo baja por el borde izquierdo: de la foto al boton (§11.1) */}
            <div className="ficha-trazo" aria-hidden="true">
              <TrazoColumna alto="100%" />
            </div>

            <div className="ficha-bloque">
              <h1 className="ficha-nombre">{producto.nombre}</h1>
              <p className="price">{formatCOP(producto.precio)}</p>
            </div>
          </div>
        </div>
      </VarianteProvider>
    </article>
  )
}
```

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

1. `http://localhost:3000/leggings/legging-duna` — carga. Miga de pan arriba, galería a la izquierda, nombre y precio a la derecha.
2. A 1440px: cuatro miniaturas en columna a la izquierda de la foto grande; al pulsar la tercera cambia la foto grande y el borde Umber se mueve.
3. La columna derecha se queda pegada al hacer scroll y la línea Ochre baja por su borde izquierdo, dibujándose una vez.
4. A 390px: la galería ocupa el ancho completo, se desliza con el dedo, y el punto activo cambia al soltar. Los puntos son tocables (44×44).
5. `http://localhost:3000/tops/legging-duna` → 404 diseñado.
6. `http://localhost:3000/leggings/no-existe` → 404 diseñado.
7. Con JavaScript desactivado, a 1440px la galería se ve como una columna con las cuatro fotos, sin miniaturas y sin puntos. Nada escondido.
8. La pestaña dice `Legging Duna · NUDE SPORTSWEAR`.

- [ ] **Step 7: Build y commit**

```bash
npm run lint && npm run build
ls out/leggings/legging-duna.html out/sets/set-arena.html
git add src/app/globals.css src/components/producto/Variante.tsx src/components/producto/Galeria.tsx src/components/producto/MigaDePan.tsx "src/app/(tienda)/[categoria]/[slug]"
git commit -m "$(cat <<'EOF'
feat(ficha): ruta, estado de variante y galeria

Color y talla van por contexto para no convertir toda la ficha en Client
Component: el proveedor envuelve las dos columnas y lo de servidor pasa
por children. Mismo patron que BuscadorProvider.

La galeria es un solo marcado; el CSS decide carrusel o miniaturas. Sin
JavaScript queda una columna con las cuatro fotos, nada escondido.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 8: Ficha — bloque de compra

SKU, medios de pago junto al precio, color, talla, guía de tallas, inventario honesto y el botón de agregar. Es donde el spec de diseño concentra el aporte de la referencia: subir la información de pago a la altura del precio en vez de enterrarla al final.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/copy.ts`
- Create: `src/lib/tallas.ts`
- Create: `src/components/producto/GuiaTallas.tsx`
- Create: `src/components/producto/SelectorVariante.tsx`
- Modify: `src/app/(tienda)/[categoria]/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useVariante` (tarea 7); `Swatch`, `BotonTalla`, `Boton`, `Panel`; `Truck`, `Wallet`, `Ruler`.
- Produce:
  - `src/lib/tallas.ts` → `type FilaTallas = { talla: Talla; busto: string; cintura: string; cadera: string }` · `const TABLA_TALLAS: FilaTallas[]`
  - `GuiaTallas()` — Client Component (link + panel)
  - `SelectorVariante.tsx` exporta `SkuActivo()`, `SelectorColor()`, `SelectorTalla()`, `AvisoInventario()`, `BotonAgregar()`, `PanelConfirmacion()` — todos Client Components sin props, consumen el contexto

- [ ] **Step 1: Añadir el microcopy y el CSS**

En `src/lib/copy.ts`, dentro de `microcopy`:

```ts
  elegirTalla: 'Elige una talla',
```

En `src/app/globals.css`, dentro del bloque `10m. Ficha de producto`, después de `.ficha-inventario`:

```css
/**
 * Medios de pago justo bajo el precio. El gesto viene de la referencia, no el
 * contenido: alla hay un widget de credito y aqui el checkout es contra entrega
 * y transferencia (SPEC §4.5). Lo que se copia es subir la informacion de pago a
 * la altura del precio en vez de enterrarla al final de la pagina.
 */
.ficha-pagos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.ficha-pago {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.ficha-pago svg {
  flex: none;
  color: var(--line);
}

.ficha-talla-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.tabla-tallas {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tabla-tallas th,
.tabla-tallas td {
  text-align: left;
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid var(--line-soft);
}

.tabla-tallas th {
  font-family: var(--font-jost), ui-sans-serif, system-ui, sans-serif;
  font-weight: 400;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}
```

- [ ] **Step 2: Escribir la tabla de medidas**

Crear `src/lib/tallas.ts`:

```ts
import type { Talla } from './producto-modelo'

/**
 * Tabla de medidas de la guia de tallas (SPEC §4.3).
 *
 * TODO(decision-abierta-1): las medidas son PROVISIONALES. El SPEC §13 deja
 * abierto si el tallaje es XS–XL o talla unica, y eso lo confirma el proveedor.
 * Publicar medidas equivocadas sube las devoluciones, que es exactamente lo que
 * la guia existe para bajar: antes de quitar el `noindex` del sitio hay que
 * reemplazar estos numeros por los del tecnico de la prenda.
 */

export type FilaTallas = {
  talla: Talla
  busto: string
  cintura: string
  cadera: string
}

export const TABLA_TALLAS: FilaTallas[] = [
  { talla: 'XS', busto: '78 – 82', cintura: '60 – 64', cadera: '86 – 90' },
  { talla: 'S', busto: '83 – 87', cintura: '65 – 69', cadera: '91 – 95' },
  { talla: 'M', busto: '88 – 92', cintura: '70 – 74', cadera: '96 – 100' },
  { talla: 'L', busto: '93 – 98', cintura: '75 – 80', cadera: '101 – 106' },
  { talla: 'XL', busto: '99 – 104', cintura: '81 – 86', cadera: '107 – 112' },
]
```

- [ ] **Step 3: Escribir la guía de tallas**

Crear `src/components/producto/GuiaTallas.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { Ruler } from '@/components/ui/icons'
import { microcopy } from '@/lib/copy'
import { TABLA_TALLAS } from '@/lib/tallas'

/**
 * SPEC §4.3 — link que abre panel lateral con la tabla de medidas. Reutiliza el
 * mismo <dialog> del carrito y del buscador.
 */
export function GuiaTallas() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button type="button" className="link body-s" onClick={() => setAbierto(true)}>
        {microcopy.guiaTallas}
      </button>

      <Panel abierto={abierto} onCerrar={() => setAbierto(false)} titulo={microcopy.guiaTallas}>
        <div className="flex flex-col gap-6">
          <p className="body-s text-muted">
            Medidas del cuerpo en centimetros. Si estas entre dos tallas, elige la mayor: la tela
            cede.
          </p>

          <div className="tabla-scroll">
            <table className="tabla-tallas">
              <caption className="visually-hidden">
                Equivalencia de tallas en centimetros de busto, cintura y cadera
              </caption>
              <thead>
                <tr>
                  <th scope="col">Talla</th>
                  <th scope="col">Busto</th>
                  <th scope="col">Cintura</th>
                  <th scope="col">Cadera</th>
                </tr>
              </thead>
              <tbody>
                {TABLA_TALLAS.map((fila) => (
                  <tr key={fila.talla}>
                    <th scope="row">{fila.talla}</th>
                    <td>{fila.busto}</td>
                    <td>{fila.cintura}</td>
                    <td>{fila.cadera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="field-hint">
            <Ruler size={16} weight="light" aria-hidden="true" /> Mide sobre la piel, sin apretar la
            cinta.
          </p>
        </div>
      </Panel>
    </>
  )
}
```

- [ ] **Step 4: Escribir los selectores de variante**

Crear `src/components/producto/SelectorVariante.tsx`:

```tsx
'use client'

import { Boton } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { BotonTalla, Swatch } from '@/components/ui/Selectores'
import { microcopy } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import { estadoVisible } from '@/lib/producto-modelo'
import { GuiaTallas } from './GuiaTallas'
import { useVariante } from './Variante'

/**
 * Las piezas del bloque de compra que dependen del color y de la talla elegidos.
 * Van sueltas y sin props para que la pagina las coloque en el orden del SPEC
 * §4.3 sin tener que convertir toda la columna en un Client Component: entre una
 * y otra hay parrafos que renderiza el servidor.
 */

/** SKU de la variante elegida; el del color mientras no hay talla. */
export function SkuActivo() {
  const { producto, color, variante } = useVariante()
  const sku = variante?.sku ?? producto.variantes.find((v) => v.color === color)?.sku
  return <p className="ficha-sku">{sku}</p>
}

/** SPEC §4.3 — swatches circulares de 32px con el nombre del elegido al lado. */
export function SelectorColor() {
  const { colores, color, elegirColor } = useVariante()
  if (colores.length < 2) return null

  return (
    <div className="ficha-bloque">
      <div className="ficha-color-head">
        <span className="label text-muted">Color</span>
        <span className="body-s">{color}</span>
      </div>
      <div className="ficha-opciones">
        {colores.map((c) => (
          <Swatch
            key={c.nombre}
            nombre={c.nombre}
            hex={c.hex}
            seleccionado={c.nombre === color}
            onClick={() => elegirColor(c.nombre)}
          />
        ))}
      </div>
    </div>
  )
}

/** SPEC §4.3 — las agotadas se ven tachadas, no desaparecen. */
export function SelectorTalla() {
  const { tallas, talla, elegirTalla, stockDeTalla } = useVariante()

  return (
    // El id es el ancla de la barra de compra de movil (tarea 9): sin talla
    // elegida, su boton trae aqui en vez de quedarse muerto.
    <div className="ficha-bloque" id="ficha-tallas">
      <div className="ficha-talla-head">
        <span className="label text-muted">Talla</span>
        <GuiaTallas />
      </div>
      <div className="ficha-opciones">
        {tallas.map((t) => (
          <BotonTalla
            key={t}
            talla={t}
            seleccionada={t === talla}
            agotada={stockDeTalla(t) === 0}
            onClick={() => elegirTalla(t)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * SPEC §7 — "Ultimas 3 unidades" solo si es cierto. Sin contadores regresivos y
 * sin "12 personas viendo esto": la urgencia falsa es lo contrario a confianza
 * silenciosa. Por eso solo se pinta cuando hay talla elegida y el numero sale
 * del stock de esa variante.
 */
export function AvisoInventario() {
  const { talla, variante } = useVariante()
  if (!talla || !variante || variante.stock === 0 || variante.stock > 3) return null

  return (
    <p className="body-s ficha-inventario" role="status">
      {variante.stock === 1
        ? `Ultima unidad en talla ${talla}`
        : `Ultimas ${variante.stock} unidades en talla ${talla}`}
    </p>
  )
}

/** SPEC §4.3 — boton Umber solido, ancho completo. */
export function BotonAgregar() {
  const { producto, talla, variante, agregar } = useVariante()

  const agotado = estadoVisible(producto) === 'agotado'
  const listo = Boolean(talla && variante && variante.stock > 0)

  return (
    <Boton ancho disabled={agotado || !listo} onClick={agregar}>
      {agotado ? microcopy.agotado : listo ? microcopy.agregar : microcopy.elegirTalla}
    </Boton>
  )
}

/**
 * SPEC §4.4 — la confirmacion es el panel lateral, no una barra inferior ni una
 * pagina aparte. Se monta UNA sola vez por ficha: lo abren tanto este bloque como
 * la barra de compra de movil (tarea 9).
 *
 * TODO(fase-4): el carrito de verdad —estado, cantidades, subtotal— es de la
 * fase 4. Lo que falta es persistir lo elegido, no la pantalla.
 */
export function PanelConfirmacion() {
  const { producto, color, talla, confirmado, cerrarConfirmacion } = useVariante()

  return (
    <Panel
      abierto={confirmado}
      onCerrar={cerrarConfirmacion}
      titulo="Tu carrito"
      pie={
        <Boton variante="secundario" ancho onClick={cerrarConfirmacion}>
          {microcopy.seguirViendo}
        </Boton>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="quote">{microcopy.agregado}</p>
        <p className="body-s text-muted">
          {producto.nombre} · {color} · Talla {talla}
        </p>
        <p className="price-sm">{formatCOP(producto.precio)}</p>
      </div>
    </Panel>
  )
}
```

- [ ] **Step 5: Montar el bloque de compra en la ficha**

En `src/app/(tienda)/[categoria]/[slug]/page.tsx`:

1. Añadir a los imports:

```tsx
import {
  AvisoInventario,
  BotonAgregar,
  PanelConfirmacion,
  SelectorColor,
  SelectorTalla,
  SkuActivo,
} from '@/components/producto/SelectorVariante'
import { Truck, Wallet } from '@/components/ui/icons'
```

2. Reemplazar el contenido de `<div className="ficha-compra">` (dejando el `ficha-trazo` como está) por:

```tsx
            <div className="ficha-bloque">
              <h1 className="ficha-nombre">{producto.nombre}</h1>
              <SkuActivo />
            </div>

            <div className="ficha-bloque">
              <p className="price">{formatCOP(producto.precio)}</p>
              {/* Aporte de la referencia: el pago, a la altura del precio */}
              <div className="ficha-pagos body-s">
                <span className="ficha-pago">
                  <Truck size={16} weight="light" aria-hidden="true" />
                  Pago contra entrega
                </span>
                <span className="ficha-pago">
                  <Wallet size={16} weight="light" aria-hidden="true" />
                  Nequi o Bancolombia
                </span>
              </div>
            </div>

            <SelectorColor />
            <SelectorTalla />
            <AvisoInventario />
            <BotonAgregar />
```

3. Montar el panel de confirmación **una sola vez**, como último hijo dentro de `<VarianteProvider>` y fuera de `<div className="ficha">`:

```tsx
        <PanelConfirmacion />
```

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000/leggings/legging-duna`:
1. Orden de arriba abajo: nombre, SKU, precio, medios de pago, color, talla, botón.
2. El botón arranca deshabilitado y dice "Elige una talla".
3. Al elegir talla el botón se activa y dice "Agregar al carrito". El SKU cambia a `LEG-DUN-M`.
4. Talla XL en Duna se ve **tachada y deshabilitada**, no desaparece.
5. Al cambiar a Negro Humo, la galería cambia de fotos, la talla elegida se conserva si el color nuevo la tiene y se limpia si no.
6. `http://localhost:3000/sets/set-duna` — un solo color: el bloque Color no aparece. Al elegir XL sale "Ultima unidad en talla XL".
7. `http://localhost:3000/leggings/legging-medano` — al elegir S en Duna sale "Ultimas 2 unidades en talla S".
8. `http://localhost:3000/tops/top-umbra` — todas las tallas tachadas y el botón dice "Agotado por ahora", deshabilitado.
9. "Guia de tallas" abre el panel lateral con la tabla; se cierra con Esc.
10. Con talla elegida, "Agregar al carrito" abre el panel con "Listo. Esta en tu carrito." y el nombre, color, talla y precio.
11. Tabular por todo el bloque: cada swatch, cada talla, el link de guía y el botón reciben foco Ochre.

- [ ] **Step 7: Lint, build y commit**

```bash
npm run lint && npm run build
git add src/app/globals.css src/lib/copy.ts src/lib/tallas.ts src/components/producto/GuiaTallas.tsx src/components/producto/SelectorVariante.tsx "src/app/(tienda)/[categoria]/[slug]/page.tsx"
git commit -m "$(cat <<'EOF'
feat(ficha): bloque de compra

SKU, medios de pago a la altura del precio, color, talla, guia de tallas,
inventario y boton. Las tallas agotadas se ven tachadas, no desaparecen,
y el aviso de inventario solo aparece cuando el numero es cierto.

TODO(decision-abierta-1): las medidas de la tabla son provisionales.
TODO(fase-4): falta persistir el carrito, no la pantalla de confirmacion.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 9: Ficha — contenido, "Completa el look" y barra de compra móvil

Cierra la ficha: descripción, detalles, acordeones, los cuatro productos que combinan y la barra que mantiene el precio y el botón en pantalla desde que entras.

**Desviación documentada — dónde van descripción, detalles y acordeones.** El spec de diseño los lista como elementos 10–12 de la columna derecha, y a la vez pide que esa columna sea **pegajosa**. Las dos cosas no pueden ser ciertas: con nombre, SKU, precio, pagos, color, talla, inventario, botón, descripción, detalles y tres acordeones, la columna mide más que la pantalla, y una columna `sticky` más alta que el viewport se ancla arriba y deja su parte de abajo fuera de alcance mientras la galería sigue bajando. Se resuelve dejando en la columna pegajosa lo que decide la compra (elementos 0–9) y bajando descripción, detalles y acordeones a una banda propia sobre el eje izquierdo. **En móvil el orden vertical queda exactamente como lo describe el spec**, porque ahí las columnas se apilan igual.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/copy.ts`
- Modify: `src/components/producto/GridProducto.tsx`
- Create: `src/components/producto/BarraCompra.tsx`
- Modify: `src/app/(tienda)/[categoria]/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useVariante`, `combinaCon`, `Acordeon`/`ItemAcordeon`, `GridProducto`, `Boton`, `formatCOP`.
- Produce:
  - `src/lib/copy.ts` → `const politicas: readonly { titulo: string; texto: string }[]`
  - `GridProducto({ productos, className? })` — gana `className` opcional
  - `BarraCompra()` — Client Component sin props

- [ ] **Step 1: Añadir las políticas al copy**

En `src/lib/copy.ts`, al final del archivo:

```ts
/**
 * SPEC §4.3 — los tres acordeones de la ficha. Estan aqui y no en la pagina para
 * que el dia que existan /envios y /cambios como paginas de contenido el texto
 * salga de un solo sitio.
 *
 * TODO(decision-abierta-3): no se nombra tarifa ni umbral de envio gratis. El
 * SPEC §13 deja abierto cotizar transportadora y confirmar si $14.000 y $20.000
 * cubren el costo real; poner una cifra que despues cambie es peor que no
 * ponerla.
 */
export const politicas = [
  {
    titulo: 'Envios y entregas',
    texto:
      'Enviamos a todo Colombia. Llega en 2 a 4 dias habiles. El costo del envio se calcula al finalizar la compra, y puedes pagar contra entrega, en efectivo, cuando recibas.',
  },
  {
    titulo: 'Cambios y devoluciones',
    texto:
      'Tienes 15 dias desde que recibes para cambiar la talla o el color. La prenda tiene que volver sin usar y con su etiqueta. Escribinos por WhatsApp y coordinamos la recogida.',
  },
  {
    titulo: 'Como cuidar tu prenda',
    texto:
      'Lava a mano en agua fria y con jabon suave. Sin blanqueador y sin secadora. Seca a la sombra y extendida: el sol abre el elastano y la prenda pierde la forma.',
  },
] as const
```

- [ ] **Step 2: Añadir el CSS del cierre de la ficha**

En `src/app/globals.css`, al final del bloque `10n. Galeria`:

```css
/* ---------- 10o. Cierre de la ficha ---------- */

.ficha-detalle {
  padding-block: 56px 16px;
}

.ficha-detalle-texto {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.completa {
  padding-top: 48px;
}

.completa-titulo {
  margin-bottom: 24px;
}

/**
 * Cuatro columnas en escritorio. La usan "Completa el look" y los destacados de
 * la home: con cuatro productos, tres columnas dejan uno solo en la segunda fila.
 */
@media (min-width: 768px) {
  .grid-cuatro {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/**
 * SPEC §4.3 — barra de compra de movil: precio y "Agregar" desde que entras.
 *
 * Es `sticky`, no `fixed`. `fixed` la deja flotando tambien sobre el footer y
 * obliga a reservar relleno inferior en toda la pagina; `sticky` como ultimo
 * hijo del articulo se mantiene pegada abajo mientras la ficha esta en pantalla
 * y se suelta sola al terminarla. Menos CSS y ningun solape.
 */
.barra-compra {
  position: sticky;
  bottom: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding: 12px 24px calc(12px + env(safe-area-inset-bottom));
  background-color: var(--bg);
  border-top: 1px solid var(--line-soft);
}

.barra-compra .btn {
  flex: 1;
}

@media (min-width: 768px) {
  .barra-compra {
    padding-inline: 48px;
  }
}

/* Desde 1024px hay dos columnas y el boton ya vive pegajoso en la derecha */
@media (min-width: 1024px) {
  .barra-compra {
    display: none;
  }
}
```

- [ ] **Step 3: Permitir una variante de grilla**

En `src/components/producto/GridProducto.tsx`, cambiar la firma y el `className`:

```tsx
import { cx } from '@/lib/format'
import type { Producto } from '@/lib/producto-modelo'
import { CardProducto } from './CardProducto'

export function GridProducto({
  productos,
  className,
}: {
  productos: Producto[]
  className?: string
}) {
  return (
    <ul className={cx('grid-producto', className)}>
      {productos.map((producto) => (
        <li key={producto.slug}>
          <CardProducto producto={producto} />
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Escribir la barra de compra**

Crear `src/components/producto/BarraCompra.tsx`:

```tsx
'use client'

import { Boton } from '@/components/ui/Button'
import { microcopy } from '@/lib/copy'
import { formatCOP } from '@/lib/format'
import { estadoVisible } from '@/lib/producto-modelo'
import { useVariante } from './Variante'

/**
 * SPEC §4.3 — en movil, precio y "Agregar al carrito" siempre en pantalla.
 *
 * La referencia lo resuelve al reves: no tiene barra en la ficha y saca una
 * barra negra inferior DESPUES de agregar, como confirmacion. Aqui el boton
 * nunca se va de pantalla y la confirmacion es el panel lateral del §4.4.
 *
 * Sin talla elegida el boton no se desactiva: lleva al selector. Un boton muerto
 * en la barra que la clienta ve todo el rato no dice que le falta hacer.
 */
export function BarraCompra() {
  const { producto, talla, variante, agregar } = useVariante()

  const agotado = estadoVisible(producto) === 'agotado'
  const listo = Boolean(talla && variante && variante.stock > 0)

  function irATallas() {
    const destino = document.getElementById('ficha-tallas')
    if (!destino) return
    destino.scrollIntoView({ block: 'center' })
    destino.querySelector<HTMLButtonElement>('.size-btn:not(:disabled)')?.focus()
  }

  return (
    <div className="barra-compra">
      <p className="price-sm">{formatCOP(producto.precio)}</p>
      <Boton disabled={agotado} onClick={listo ? agregar : irATallas}>
        {agotado ? microcopy.agotado : listo ? microcopy.agregar : microcopy.elegirTalla}
      </Boton>
    </div>
  )
}
```

- [ ] **Step 5: Montar el cierre de la ficha**

En `src/app/(tienda)/[categoria]/[slug]/page.tsx`:

1. Añadir estos imports, y **reemplazar** la línea existente de `@/lib/productos` por la de abajo (gana `combinaCon`):

```tsx
import { Reveal } from '@/components/motion/Reveal'
import { BarraCompra } from '@/components/producto/BarraCompra'
import { GridProducto } from '@/components/producto/GridProducto'
import { Acordeon, ItemAcordeon } from '@/components/ui/Acordeon'
import { politicas } from '@/lib/copy'
import { combinaCon, listarProductos, obtenerProducto } from '@/lib/productos'
```

2. Cargar los productos que combinan, junto a `obtenerProducto`:

```tsx
  const relacionados = await combinaCon(slug)
```

3. Después de `</div>` (el cierre de `<div className="ficha">`) y todavía dentro de `<VarianteProvider>`, añadir:

```tsx
        <section className="ficha-detalle eje">
          <div className="ficha-detalle-texto">
            <p className="body measure">{producto.descripcion}</p>

            <div className="ficha-bloque">
              <h2 className="label text-muted">Detalles</h2>
              <ul className="body-s text-muted ficha-detalles">
                {producto.detalles.map((detalle) => (
                  <li key={detalle}>{detalle}</li>
                ))}
              </ul>
            </div>

            <Acordeon>
              {politicas.map((politica) => (
                <ItemAcordeon key={politica.titulo} titulo={politica.titulo}>
                  {politica.texto}
                </ItemAcordeon>
              ))}
            </Acordeon>
          </div>
        </section>

        {relacionados.length > 0 && (
          <section className="completa">
            <Reveal>
              <h2 className="title completa-titulo">Completa el look</h2>
            </Reveal>
            <GridProducto productos={relacionados} className="grid-cuatro" />
          </section>
        )}

        <BarraCompra />
        <PanelConfirmacion />
```

> `<PanelConfirmacion />` ya se añadió en la tarea 8; si quedó dentro de `<div className="ficha">`, moverlo aquí — tiene que ser hermano de `<BarraCompra />`, no hijo de la columna pegajosa.

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000/leggings/legging-duna`:
1. A 1440px: la columna derecha se queda pegada mientras baja la galería y **se ve entera** — nada suyo queda fuera de pantalla. Debajo de las dos columnas: descripción sobre el eje izquierdo, detalles y los tres acordeones cerrados.
2. Los acordeones abren y cierran con animación a altura automática; el chevron gira.
3. "Completa el look": cuatro cards en cuatro columnas. Pulsando una se navega a su ficha.
4. La barra de compra **no** aparece a 1440px.
5. A 390px: la barra está pegada abajo desde que entras, con el precio a la izquierda y el botón a la derecha. Se mantiene al hacer scroll y se suelta al llegar al footer, sin taparlo.
6. Sin talla elegida, pulsar el botón de la barra lleva al selector de tallas y enfoca la primera talla disponible.
7. Con talla elegida, pulsarlo abre el panel de confirmación. El mismo panel, no dos.
8. Con JavaScript desactivado: la descripción, los detalles y el **texto de los tres acordeones** se leen en la página (el acordeón no usa `display: none`).

- [ ] **Step 7: Lint, build y commit**

```bash
npm run lint && npm run build
git add src/app/globals.css src/lib/copy.ts src/components/producto/GridProducto.tsx src/components/producto/BarraCompra.tsx "src/app/(tienda)/[categoria]/[slug]/page.tsx"
git commit -m "$(cat <<'EOF'
feat(ficha): contenido, completa el look y barra de compra movil

Descripcion, detalles y acordeones bajan a su propia banda sobre el eje:
en la columna pegajosa no caben, y una columna sticky mas alta que la
pantalla deja su parte de abajo fuera de alcance. En movil el orden
vertical queda igual al del spec.

La barra es sticky y no fixed: se suelta al terminar la ficha en vez de
flotar sobre el footer.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 10: Home — hero, tiles de categoría y destacados

La home deja de ser una cáscara. Entran los bloques 4 y 5, que son los que llevan al catálogo, y el hero sube al alto que pide el SPEC §4.1.

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/home/TileCategoria.tsx`
- Modify: `src/app/(tienda)/page.tsx`

**Interfaces:**
- Consumes: `FotoFondo`, `Reveal`, `BotonLink`, `GridProducto` (con `className`), `destacados`, `NOMBRE_CATEGORIA`, `microcopy`.
- Produce: `TileCategoria({ categoria, foto, alt }: { categoria: Categoria; foto: string; alt: string })` — Server Component.

- [ ] **Step 1: Subir el hero a ~85vh**

En `src/app/globals.css`, en `.hero`, reemplazar:

```css
  min-height: 72vh;
  min-height: 72svh;
```

por:

```css
  /* SPEC §4.1 bloque 2: ~85vh. `svh` y no `vh` porque en movil `vh` cuenta la
     barra del navegador que aun no se ha retraido y el hero arranca mas alto de
     lo que se ve. */
  min-height: 85vh;
  min-height: 85svh;
```

y en el bloque `@media (min-width: 768px) { .hero { ... } }` reemplazar:

```css
    min-height: 78vh;
    min-height: min(78svh, 820px);
```

por:

```css
    min-height: 85vh;
    min-height: min(85svh, 900px);
```

- [ ] **Step 2: Añadir el CSS de tiles y destacados**

En `src/app/globals.css`, dentro del bloque `10f. Bloques de la home`, después de `.hero-trazo`:

```css
/* ---------- Bloque 4: tiles de categoria (SPEC §4.1) ---------- */

/**
 * A sangre y pegados: el corte entre dos fotos es la unica linea que hace falta.
 * 2px de separacion, no 24: un gutter ancho los convierte en tres tarjetas y el
 * bloque pierde la fuerza de banda continua.
 */
.tiles {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
}

@media (min-width: 768px) {
  .tiles {
    grid-template-columns: repeat(3, 1fr);
  }
}

.tile {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  aspect-ratio: 3 / 4;
  color: var(--text-invert);
  text-decoration: none;
}

.tile img {
  z-index: -2;
}

/* Mismo velo calibrado del hero: el nombre va sobre `fuerte`, que es el unico
   nivel que aguanta texto sobre la pared clara del estudio (ver §1 de este css) */
.tile-velo {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    0deg,
    var(--velo-fuerte) 0%,
    var(--velo-medio) 40%,
    transparent 72%
  );
}

.tile-nombre {
  padding: 24px;
  transition: color var(--dur-fast) var(--ease);
}

@media (hover: hover) {
  .tile:hover .tile-nombre {
    color: var(--dune);
  }
}

/* ---------- Bloque 5: destacados ---------- */

.destacados-head {
  margin-bottom: 32px;
}
```

- [ ] **Step 3: Escribir el tile de categoría**

Crear `src/components/home/TileCategoria.tsx`:

```tsx
import Link from 'next/link'
import { FotoFondo } from '@/components/media/FotoFondo'
import type { Categoria } from '@/lib/producto-modelo'
import { NOMBRE_CATEGORIA } from '@/lib/producto-modelo'

/**
 * SPEC §4.1 bloque 4 — tile a sangre con el nombre encima de la foto.
 *
 * El nombre va en HTML sobre la imagen, nunca quemado en el JPG: se traduce, se
 * indexa, lo lee un lector de pantalla y no obliga a rehacer el arte cuando
 * cambia el copy.
 */
export function TileCategoria({
  categoria,
  foto,
  alt,
}: {
  categoria: Categoria
  foto: string
  alt: string
}) {
  return (
    <Link href={`/${categoria}`} className="tile on-dark">
      <FotoFondo
        nombre={foto}
        anchos={[441]}
        ancho={441}
        alto={588}
        sizes="(min-width: 768px) 33vw, 100vw"
        alt={alt}
      />
      <div className="tile-velo" aria-hidden="true" />
      <h3 className="title tile-nombre">{NOMBRE_CATEGORIA[categoria]}</h3>
    </Link>
  )
}
```

- [ ] **Step 4: Montar los bloques 4 y 5 en la home**

En `src/app/(tienda)/page.tsx`:

1. Añadir a los imports:

```tsx
import { TileCategoria } from '@/components/home/TileCategoria'
import { GridProducto } from '@/components/producto/GridProducto'
import { microcopy } from '@/lib/copy'
import { destacados } from '@/lib/productos'
```

2. Convertir la página en `async` y cargar los destacados:

```tsx
export default async function Home() {
  const productosDestacados = await destacados(4)
  return (
```

3. Cambiar el botón del hero, que hasta ahora llevaba a la herramienta interna:

```tsx
            <BotonLink href="/colecciones" variante="outline-invert">
              Ver la coleccion
            </BotonLink>
```

4. Insertar los dos bloques nuevos **entre** la sección del manifiesto y la de los pilares:

```tsx
      {/* Categorias — SPEC §4.1 bloque 4. A sangre: la foto toca el borde de la
          pantalla. Es el contraste con el margen amplio del texto lo que hace que
          esto lea como editorial y no como plantilla centrada. */}
      <section className="tiles" aria-label="Categorias">
        <TileCategoria
          categoria="leggings"
          foto="categoria-leggings"
          alt="Detalle de la cinturilla alta de un legging NUDE, de perfil"
        />
        <TileCategoria
          categoria="tops"
          foto="categoria-tops"
          alt="Top corto NUDE con panel de malla, vista frontal"
        />
        <TileCategoria
          categoria="sets"
          foto="categoria-sets"
          alt="Conjunto NUDE de top y legging, cuerpo entero"
        />
      </section>

      {/* Destacados — SPEC §4.1 bloque 5. Grilla, no carrusel: el carrusel
          esconde producto detras de una flecha. */}
      <section className="section">
        <div className="container-nude">
          <div className="eje destacados-head">
            <Reveal>
              <p className="label text-muted">Lo nuevo</p>
              <h2 className="title">Primera Piel</h2>
            </Reveal>
            <Reveal className="eje-fin" delay={80}>
              <BotonLink href="/colecciones" variante="secundario">
                {microcopy.verTodo}
              </BotonLink>
            </Reveal>
          </div>
          <GridProducto productos={productosDestacados} className="grid-cuatro" />
        </div>
      </section>
```

> `Reveal` acepta `className`, así que `eje-fin` viaja en él y el botón cae al extremo derecho de la misma línea del título. En móvil `.eje` colapsa a una columna y el botón vuelve al eje izquierdo.

- [ ] **Step 5: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000`:
1. El hero ocupa ~85% del alto de la pantalla.
2. El botón del hero dice "Ver la coleccion" y lleva a `/colecciones`.
3. Bajo el manifiesto, tres tiles a sangre que **tocan los dos bordes** de la pantalla, con 2px entre ellos y el nombre abajo a la izquierda de cada foto. El texto se lee sobre la foto sin esfuerzo.
4. Cada tile lleva a su catálogo.
5. Destacados: título y etiqueta sobre el eje izquierdo, "Ver todo" al extremo derecho de la misma línea, cuatro cards en cuatro columnas.
6. A 390px: los tiles se apilan, y el "Ver todo" cae bajo el título alineado a la izquierda. Sin scroll horizontal.
7. Con `prefers-reduced-motion` activo (DevTools → Rendering → Emulate CSS prefers-reduced-motion), nada aparece invisible.

- [ ] **Step 6: Lint, build y commit**

```bash
npm run lint && npm run build
git add src/app/globals.css src/components/home/TileCategoria.tsx "src/app/(tienda)/page.tsx"
git commit -m "$(cat <<'EOF'
feat(home): hero a 85vh, tiles de categoria y destacados

Las tiles van a sangre y pegadas: el corte entre dos fotos es la unica
linea que hace falta. Los destacados son grilla y no carrusel porque el
carrusel esconde producto.

El boton del hero deja de llevar a /sistema y lleva al catalogo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 11: Home — franja de confianza, comunidad y captura de correo

Los tres bloques que cierran la home. El 7 cambia de tratamiento (gana ícono), el 8 es el único aporte estructural de la referencia y el 9 es el activo más valioso en prelanzamiento.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/site.ts`
- Modify: `src/lib/copy.ts`
- Create: `src/components/home/Comunidad.tsx`
- Create: `src/components/home/Newsletter.tsx`
- Modify: `src/app/(tienda)/page.tsx`

**Interfaces:**
- Consumes: `FotoFondo`, `Reveal`, `Boton`, `CampoTexto`, `site`, `Truck`, `Wallet`, `ArrowsClockwise`, `InstagramLogo`.
- Produce:
  - `src/lib/site.ts` → `promesas` gana `icono: 'envio' | 'pago' | 'cambio'`
  - `Comunidad()` — Server Component sin props
  - `Newsletter()` — Client Component sin props

**Desviación documentada.** `.promesas` / `.promesa` se renombran a `.franja-iconos` / `.franja-icono`: el bloque 7 cambia de tratamiento y mantener las dos parejas de clases dejaría CSS muerto en el archivo.

- [ ] **Step 1: Añadir el ícono a cada promesa**

En `src/lib/site.ts`, reemplazar el bloque `promesas`:

```ts
/**
 * SPEC §4.1 bloque 7 — franja de confianza.
 * El tratamiento con icono viene de la referencia (femaleforce.com.co): icono de
 * linea + titulo + una linea. El contenido es el del SPEC, no el de alla.
 *
 * El icono se nombra, no se importa: `site.ts` no debe arrastrar componentes de
 * React a cualquiera que lea configuracion.
 */
export const promesas = [
  {
    icono: 'envio',
    titulo: 'Envio a todo Colombia',
    detalle: 'Llega en 2 a 4 dias habiles.',
  },
  {
    icono: 'pago',
    titulo: 'Pago contra entrega',
    detalle: 'Pagas en efectivo cuando recibas.',
  },
  {
    icono: 'cambio',
    titulo: 'Cambios en 15 dias',
    detalle: 'Si no es tu talla, la cambiamos.',
  },
] as const
```

- [ ] **Step 2: Añadir el microcopy del newsletter**

En `src/lib/copy.ts`, dentro de `microcopy`:

```ts
  newsletterListo: 'Listo. Te escribimos cuando abramos.',
  newsletterError: 'Nos falta tu correo para escribirte.',
  newsletterInvalido: 'Revisa el correo: parece que le falta algo.',
```

- [ ] **Step 3: Renombrar la franja y añadir el CSS de comunidad y newsletter**

En `src/app/globals.css`, reemplazar el bloque de `.promesas-franja` / `.promesas` / `.promesa` por:

```css
/* ---------- Bloque 7: franja de confianza (SPEC §4.1) ---------- */

.franja-confianza {
  padding-block: 48px;
}

.franja-iconos {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 640px) {
  .franja-iconos {
    grid-template-columns: repeat(3, 1fr);
  }
}

.franja-icono {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.franja-icono > svg {
  color: var(--line);
}

/* ---------- Bloque 8: como la llevan (aporte de la referencia) ---------- */

.comunidad {
  padding-block: 64px 0;
}

.comunidad-head {
  margin-bottom: 24px;
}

.comunidad-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
}

@media (min-width: 768px) {
  .comunidad-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.comunidad-foto {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  background-color: var(--sahara);
}

/* ---------- Bloque 9: captura de correo (SPEC §4.1) ---------- */

.newsletter {
  padding-block: 56px;
}

.newsletter-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  max-width: 460px;
  margin-top: 20px;
}

@media (min-width: 560px) {
  .newsletter-form {
    flex-direction: row;
    align-items: flex-end;
  }

  .newsletter-form .field {
    flex: 1;
  }
}
```

- [ ] **Step 4: Escribir la grilla de comunidad**

Crear `src/components/home/Comunidad.tsx`:

```tsx
import { FotoFondo } from '@/components/media/FotoFondo'
import { InstagramLogo } from '@/components/ui/icons'
import { site } from '@/lib/site'

/**
 * SPEC de diseno §3 bloque 8 — "Como la llevan". Es el aporte estructural de la
 * referencia: prueba social sin inventar resenas.
 *
 * No hay resenas en la v1 (SPEC §4.3): sin ventas serian inventadas, y las
 * inventadas se notan. Seis fotos y la cuenta de Instagram dicen lo mismo sin
 * mentir.
 *
 * TODO(decision-abierta-5): las seis son recortes de la unica sesion que existe.
 * Cuando haya contenido real de clientas, esto se llena de eso.
 */
const FOTOS = [
  { nombre: 'comunidad-1', ancho: 441, alto: 588 },
  { nombre: 'comunidad-2', ancho: 441, alto: 588 },
  { nombre: 'comunidad-3', ancho: 441, alto: 588 },
  { nombre: 'comunidad-4', ancho: 360, alto: 480 },
  { nombre: 'comunidad-5', ancho: 360, alto: 480 },
  { nombre: 'comunidad-6', ancho: 360, alto: 480 },
]

export function Comunidad() {
  return (
    <section className="comunidad" aria-labelledby="comunidad-titulo">
      <div className="container-nude comunidad-head eje">
        <div>
          <p className="label text-muted">Como la llevan</p>
          <h2 className="title" id="comunidad-titulo">
            En movimiento
          </h2>
        </div>
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="link body-s eje-fin"
        >
          <InstagramLogo size={16} weight="light" aria-hidden="true" /> @{site.instagram}
        </a>
      </div>

      <ul className="comunidad-grid">
        {FOTOS.map((foto) => (
          <li key={foto.nombre} className="comunidad-foto">
            <FotoFondo
              nombre={foto.nombre}
              anchos={[foto.ancho]}
              ancho={foto.ancho}
              alto={foto.alto}
              sizes="(min-width: 768px) 33vw, 50vw"
              alt="Clienta de NUDE con conjunto de top y legging en tonos tierra"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 5: Escribir la captura de correo**

Crear `src/components/home/Newsletter.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { Boton } from '@/components/ui/Button'
import { CampoTexto } from '@/components/ui/Field'
import { microcopy } from '@/lib/copy'

/**
 * SPEC §4.1 bloque 9 — franja Sahara, un input y un boton. En prelanzamiento el
 * correo es el activo mas valioso, y por eso va en la home y no solo en el pie.
 *
 * TODO(fase-6): HOY EL CORREO NO SE GUARDA EN NINGUN LADO. Falta el destino —
 * coleccion `newsletter` en Firestore o el proveedor de correo que se elija. El
 * sitio esta en `noindex` y no vende todavia, asi que el formulario no ha
 * recibido nada real, pero esto tiene que conectarse ANTES de quitar el noindex.
 *
 * Es Client Component por el SPEC §12: validacion al salir del campo, y al
 * enviar cargando -> exito o error. Nunca un clic sin respuesta.
 */
export function Newsletter() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  function validar(valor: string): string | undefined {
    if (!valor.trim()) return microcopy.newsletterError
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) return microcopy.newsletterInvalido
    return undefined
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const fallo = validar(correo)
    setError(fallo)
    if (fallo) return

    setEnviando(true)
    // TODO(fase-6): aqui va la escritura real. La espera existe para que el
    // estado de carga del boton sea visible y no un parpadeo.
    await new Promise((r) => setTimeout(r, 400))
    setEnviando(false)
    setListo(true)
  }

  return (
    <section className="on-sahara newsletter">
      <div className="container-nude">
        <p className="label text-muted">Prelanzamiento</p>
        <h2 className="title">{microcopy.newsletter}</h2>

        {listo ? (
          <p className="quote" role="status">
            {microcopy.newsletterListo}
          </p>
        ) : (
          <form className="newsletter-form" onSubmit={enviar} noValidate>
            <CampoTexto
              id="newsletter-correo"
              name="correo"
              label="Tu correo"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={correo}
              error={error}
              onChange={(e) => setCorreo(e.target.value)}
              onBlur={(e) => setError(validar(e.target.value))}
            />
            <Boton type="submit" cargando={enviando}>
              Avisame
            </Boton>
          </form>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Montar los tres bloques en la home**

En `src/app/(tienda)/page.tsx`:

1. Añadir a los imports:

```tsx
import { Comunidad } from '@/components/home/Comunidad'
import { Newsletter } from '@/components/home/Newsletter'
import { ArrowsClockwise, Truck, Wallet } from '@/components/ui/icons'
```

2. Añadir el mapa de íconos fuera del componente:

```tsx
/* `site.ts` nombra el icono; la pagina lo resuelve. Asi la configuracion no
   arrastra componentes de React. */
const ICONO_PROMESA = {
  envio: Truck,
  pago: Wallet,
  cambio: ArrowsClockwise,
} as const
```

3. Reemplazar la sección de la franja de confianza por:

```tsx
      {/* Franja de confianza — SPEC §4.1 bloque 7. El tratamiento con icono
          viene de la referencia; el contenido, del SPEC. */}
      <section className="on-sahara franja-confianza">
        <div className="container-nude franja-iconos">
          {promesas.map((promesa) => {
            const Icono = ICONO_PROMESA[promesa.icono]
            return (
              <div key={promesa.titulo} className="franja-icono">
                <Icono size={24} weight="light" aria-hidden="true" />
                <h3 className="card-name">{promesa.titulo}</h3>
                <p className="body-s text-muted">{promesa.detalle}</p>
              </div>
            )
          })}
        </div>
      </section>

      <Comunidad />

      <Newsletter />
```

- [ ] **Step 7: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000`:
1. Orden de arriba abajo: hero, manifiesto, tiles, destacados, tres pilares, franja de confianza, comunidad, newsletter, footer. Diez bloques contando anuncio+header.
2. La franja de confianza es Sahara, con ícono Ochre de trazo fino sobre cada título. El texto secundario se lee (Umber pleno, no el muted).
3. Comunidad: seis fotos a sangre en tres columnas, con el título sobre el eje y el enlace a Instagram al extremo derecho de la misma línea.
4. Newsletter: franja Sahara, un campo y un botón. Enviando vacío sale "Nos falta tu correo para escribirte." con `role="alert"` bajo el campo, no solo un borde.
5. Con un correo mal formado sale "Revisa el correo: parece que le falta algo."
6. Con un correo válido, el botón muestra los tres puntos y luego el bloque se reemplaza por "Listo. Te escribimos cuando abramos."
7. A 390px: todo apila, sin scroll horizontal, y las fotos de comunidad quedan en dos columnas.

- [ ] **Step 8: Lint, build y commit**

```bash
npm run lint && npm run build
git add src/app/globals.css src/lib/site.ts src/lib/copy.ts src/components/home/Comunidad.tsx src/components/home/Newsletter.tsx "src/app/(tienda)/page.tsx"
git commit -m "$(cat <<'EOF'
feat(home): franja de confianza con iconos, comunidad y captura de correo

La grilla de comunidad es el aporte estructural de la referencia: prueba
social sin inventar resenas, que en la v1 serian inventadas.

TODO(fase-6): el correo del newsletter todavia no se guarda en ningun
lado. Hay que conectarlo antes de quitar el noindex del sitio.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

### Task 12: Verificación reproducible y documentación

El README de la fase 1 dice "Verificado con Playwright sobre Chrome real" pero esa verificación se hizo a mano y no quedó en el repo. Aquí se convierte en un comando, sobre el **export estático** —que es lo que Firebase sirve de verdad— y no sobre el dev server.

**Files:**
- Modify: `package.json`
- Create: `scripts/verificar.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `out/` producido por `npm run build`.
- Produce: `npm run verificar` — sale con código 1 si algún criterio falla.

- [ ] **Step 1: Instalar Playwright**

```bash
npm install --save-dev playwright
npx playwright install chromium
```

En `package.json`, dentro de `"scripts"`:

```json
    "verificar": "npm run build && node scripts/verificar.mjs"
```

- [ ] **Step 2: Escribir el verificador**

Crear `scripts/verificar.mjs`:

```js
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

// --- 2. Sin JavaScript: nada escondido, catalogo y ficha completos (SPEC §9.5) ---
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

// --- 3. prefers-reduced-motion: nada invisible, el trazo aparece dibujado ---
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
      '.trazo path',
      (n) => n.filter((el) => getComputedStyle(el).strokeDashoffset !== '0px').length,
    )
    comprobar(sinDibujar === 0, `${ruta} con reduced-motion deja ${sinDibujar} trazos sin dibujar`)
  }

  await ctx.close()
}

// --- 4. Los filtros viven en la URL ---
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
```

- [ ] **Step 3: Correr la verificación**

Run: `npm run verificar`
Expected: `Todo en orden: ...`

Si falla, cada línea dice la ruta, el ancho y el número medido. Los fallos más probables y su causa:
- *"desborda N px en horizontal"* → un `.a-sangre` dentro de un contenedor que no es el de 1280px.
- *"/colecciones sin JS muestra 6 cards"* → el fallback del `<Suspense>` no es `<GridProducto productos={productos} />`.
- *"controles del sistema bajo 44x44"* → un botón nuevo sin `min-height`; los del sistema ya lo traen.

**Si toda la sección "sin JavaScript" pasa sospechosamente igual que con JavaScript**, comprobar primero que el navegador está reportando de verdad `@media (scripting: enabled)` como falso con `javaScriptEnabled: false`. Todo el sistema de "nada se esconde sin JS" cuelga de esa condición, así que un falso verde ahí es peor que un rojo. Se confirma a mano: DevTools → Settings → Debugger → *Disable JavaScript*, recargar `/colecciones` y contar ocho cards.

- [ ] **Step 4: Verificación humana — lo que ningún script ve**

Con `npm run dev` abierto, recorrer esta lista y anotar lo que falle:

1. **Contraste sobre foto.** En el hero, en los tres tiles y en la grilla de comunidad: el texto Cream se lee sin esfuerzo sobre cualquier parte de la foto. Si algún tile queda justo, subir el tramo `var(--velo-fuerte)` de `.tile-velo` — no bajar el texto a otro color.
2. **Los recortes.** Ninguna cabeza cortada por la mitad en tiles ni en comunidad.
3. **Recorrido completo:** home → tile de Leggings → card → ficha → "Completa el look" → otra ficha → miga de pan → catálogo. Sin callejones.
4. **Solo teclado**, sin tocar el ratón, desde el skip link hasta el footer en la ficha: se puede elegir color, talla, abrir la guía de tallas, agregar y cerrar el panel.
5. **Tono (SPEC §7):** ningún emoji, ningún signo de exclamación, ningún porcentaje, ningún contador. El único aviso de inventario que aparece es verdadero.
6. **A 375, 768, 1024 y 1440px** la ficha y el catálogo se ven intencionales, no apretados.

- [ ] **Step 5: Actualizar el README**

En `README.md`:

1. Reemplazar el encabezado `## Estado: fase 1 completa (§9.4)` y su tabla de rutas por:

```markdown
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
```

2. En la sección `Reglas del sistema`, añadir al final:

```markdown
**Ningún componente importa `productos.json`.** Todo pasa por `src/lib/productos.ts`,
y sus cuatro funciones son `async` desde hoy aunque lean un archivo síncrono. Es lo
que hace que la fase 2 sea cambiar un cuerpo de función en vez de cada página.

**El filtrado es mejora progresiva.** El servidor renderiza la grilla entera —de ahí
sale el SEO— y el cliente la reemplaza ya filtrada. El fallback del `<Suspense>` es
esa misma grilla completa, así que sin JavaScript queda el catálogo entero.
```

3. Reemplazar la sección `## Verificado` por:

```markdown
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

Fuera del script y a mano: contraste del texto sobre fotografía, encuadre de los
recortes y tono del copy.
```

4. En la sección `## Despliegue`, reemplazar el párrafo que empieza con *"El export estático se cae en la fase 3"* por:

```markdown
**El export estático sigue en pie, y no por casualidad.** Catálogo y ficha son
rutas dinámicas prerenderizadas con `generateStaticParams` sobre el mock: las
cuatro páginas de catálogo y las ocho fichas salen en HTML. Lo que sí lo va a
tumbar es la fase 2 (Firestore en tiempo de petición) y la fase 4 (checkout con
Server Actions). Antes de esas hay que migrar a **Firebase App Hosting**.

Consecuencia hoy: **los filtros del catálogo se aplican en cliente**, no en
servidor, porque `searchParams` no existe en una página exportada. El HTML trae el
catálogo completo y el cliente lo filtra encima.
```

5. En la lista de pendientes al final de `## Despliegue`, añadir:

```markdown
**El correo del newsletter no se guarda.** `src/components/home/Newsletter.tsx`
valida y confirma, pero no escribe en ningún lado (`TODO(fase-6)`). Conectarlo
antes de quitar el `noindex`.

**Las medidas de la guía de tallas son provisionales** (`src/lib/tallas.ts`,
`TODO(decision-abierta-1)`). Las confirma el proveedor; publicar medidas
equivocadas sube las devoluciones, que es justo lo que la guía existe para bajar.
```

- [ ] **Step 6: Commit final**

```bash
npm run lint && npm test && npm run verificar
git add package.json package-lock.json scripts/verificar.mjs README.md
git commit -m "$(cat <<'EOF'
chore: verificacion reproducible y README de la fase 3

npm run verificar corre Playwright sobre out/, que es lo que Firebase
publica: un fallo del export estatico no se ve de ninguna otra forma.
Comprueba desborde, sin-JS, reduced-motion y filtros en la URL.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017wt8c9tku434VprzTCX6Jc
EOF
)"
```

---

## Cierre — qué queda abierto al terminar

Nada de esto es un descuido: son las fronteras del alcance, escritas para que no se olviden.

| Qué | Dónde está marcado |
|---|---|
| El catálogo es mock y las fotos de producto son placeholders | `src/content/productos.json`, `assets/fotos/placeholder/README.md` |
| El correo del newsletter no se guarda | `src/components/home/Newsletter.tsx`, `TODO(fase-6)` |
| "Agregar al carrito" confirma pero no persiste | `SelectorVariante.tsx`, `TODO(fase-4)` |
| Las medidas de la guía de tallas son provisionales | `src/lib/tallas.ts`, `TODO(decision-abierta-1)` |
| No se nombra tarifa ni umbral de envío | `src/lib/copy.ts`, `TODO(decision-abierta-3)` |
| Nombres de producto y de colección provisionales | `src/content/productos.json`, `TODO(decision-abierta-4)` |
| `robots: index: false` sigue puesto en el layout raíz | `src/app/layout.tsx` — quitarlo cuando el catálogo sea real |
| Rutas del menú todavía en 404: `/ropa-deportiva`, `/nosotros`, `/contacto`, `/guia-de-tallas`, `/envios`, `/cambios`, `/legales`, `/cuenta`, `/buscar` | Fuera de alcance (spec de diseño §8) |
