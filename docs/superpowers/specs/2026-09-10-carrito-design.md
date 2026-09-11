# Carrito — diseño

**Fecha:** 10 de septiembre de 2026
**Estado:** aprobado, listo para plan de implementación
**Referencia de implementación:** `~/dev/personal/opensource/ecom-myspace/ecom-app/src/App.jsx`
(patrón de carrito ya resuelto ahí: `useState` + `localStorage`, dedup por SKU,
merge de cantidades) — se porta la lógica, no la forma: ecom-myspace es un SPA de
React Router con estado en el `App.jsx` raíz; nude es Next.js App Router, así que
el mismo comportamiento se implementa como Context, siguiendo el patrón que ya
usa este repo en `VarianteProvider`/`BuscadorProvider`.

---

## 1. Qué se construye y por qué

Sub-proyecto 1 de una serie más grande (carrito → checkout → persistencia de
pedidos → panel de pedidos → cuentas de clienta, esta última pedida para que las
clientas vean sus pedidos). El `SPEC.md` §7 ya define la carcasa del carrito
(`BotonCarrito.tsx`, panel lateral, estado vacío) y la deja explícitamente para
"fase 4": este trabajo es esa fase 4, solo para el carrito — sin checkout, sin
pedidos todavía.

Al terminar: agregar un producto desde la ficha (`BarraCompra`/`Variante.tsx`)
lo mete de verdad al carrito, el ícono del header muestra la cantidad real, el
panel lateral lista los items con la interacción completa del SPEC §4.4, y el
carrito sobrevive a un refresh de página.

**Fuera de alcance:** checkout, cálculo de envío, creación de pedidos en
Postgres, cuentas de clienta. El botón "Finalizar compra" queda apuntando a
`/checkout`, que no existe todavía (sub-proyecto 2) — da 404 hasta que se
construya, y es un estado aceptable para este corte.

---

## 2. Modelo de datos

`src/lib/carrito.ts` — funciones puras, sin React, siguiendo el mismo criterio de
separación que `producto-modelo.ts` y `filtros.ts` (fácil de testear con Vitest,
que en este repo solo corre sobre `src/lib` y `src/db`).

```ts
export type ItemCarrito = {
  sku: string
  productoSlug: string
  nombre: string
  color: string
  talla: Talla
  precio: number
  imagen: string
  cantidad: number
}

export function agregarItem(items: ItemCarrito[], nuevo: Omit<ItemCarrito, 'cantidad'>, cantidad = 1): ItemCarrito[]
export function actualizarCantidad(items: ItemCarrito[], sku: string, cantidad: number): ItemCarrito[]
export function eliminarItem(items: ItemCarrito[], sku: string): ItemCarrito[]
export function totalesDe(items: ItemCarrito[]): { cantidad: number; subtotal: number }
```

- **`sku` es la llave**, no `productoSlug + color + talla`: en el schema de
  Postgres (`variantes.sku`) ya es único por combinación de producto+color+talla,
  así que reutilizarlo evita inventar una segunda identidad — mismo criterio que
  usa `ecom-myspace` (dedup por `sku` + id de producto).
- `agregarItem`: si el sku ya está, suma `cantidad` a la fila existente (igual
  que `handleAddToCart` de la referencia); si no, agrega una fila nueva.
- `actualizarCantidad`: si la cantidad resultante es `<= 0`, elimina la fila
  (igual que `handleUpdateQuantity`).
- `totalesDe`: `reduce` sobre cantidad y subtotal — mismo cálculo que
  `cartTotals` en la referencia.

No hay validación de stock aquí: el carrito confía en el stock que ya vio la
clienta en la ficha. Revalidar contra la base al momento de pagar es
responsabilidad del checkout (sub-proyecto 2), no de este.

---

## 3. Estado y persistencia — `CarritoProvider`

`src/components/carrito/CarritoProvider.tsx` — envuelve `src/app/(tienda)/layout.tsx`
(disponible en todas las páginas de la tienda, igual alcance que necesita
`BotonCarrito` en el header).

```ts
type ContextoCarrito = {
  items: ItemCarrito[]
  cantidadTotal: number
  subtotal: number
  agregar: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void
  actualizarCantidad: (sku: string, cantidad: number) => void
  eliminar: (sku: string) => void
}
```

- Arranca con `items: []` tanto en servidor como en el primer render de cliente
  (evita mismatch de hidratación). Un `useEffect` al montar lee `localStorage` y
  carga lo guardado — el mismo motivo por el que la referencia envuelve la
  lectura inicial en `try/catch` (localStorage puede no existir o venir corrupto).
- Otro `useEffect` escribe a `localStorage` en cada cambio de `items`, también en
  `try/catch` (localStorage lleno o bloqueado no debe romper el carrito, solo
  deja de persistir).
- Clave de `localStorage`: `nude-carrito`.
- El resto de las funciones del contexto son wrappers finitos sobre
  `src/lib/carrito.ts` que hacen `setItems(fn(items, ...))`.

---

## 4. Wiring a lo que ya existe

**`src/components/producto/Variante.tsx`:** `agregar()` hoy solo hace
`setConfirmado(true)`. Pasa a también llamar a
`carrito.agregar({ sku: variante.sku, productoSlug: producto.slug, nombre: producto.nombre, color, talla, precio: producto.precio, imagen: producto.imagenes[color][0] }, 1)`,
usando `useCarrito()` del nuevo provider. `confirmado` se mantiene igual (sigue
sin tener un consumidor de UI — eso es aparte de este trabajo, no se toca).

**`src/components/layout/BotonCarrito.tsx`:** deja de recibir `cantidad` por
prop — lee `cantidadTotal`, `items`, `subtotal` de `useCarrito()` directo. El
panel renderiza:
- Vacío (`items.length === 0`): el estado ya construido (`CarritoVacio`), sin
  cambios.
- Con items: lista con miniatura, nombre, color, talla, selector de cantidad
  (`±`), precio de línea, botón eliminar — todos los campos del SPEC §4.4 —
  subtotal, nota de que el envío se calcula en el siguiente paso, botón
  "Finalizar compra" (`Link` a `/checkout`) y link "Seguir viendo" que cierra el
  panel.

Ningún componente de servidor se toca: `Variante.tsx` y `BotonCarrito.tsx` ya son
`'use client'`.

---

## 5. Testing

- `src/lib/carrito.test.ts` — las cuatro funciones puras: merge de cantidad en
  `agregarItem` sobre un sku repetido, `actualizarCantidad` a 0 elimina la fila,
  `eliminarItem` de un sku que no existe no revienta, `totalesDe` sobre carrito
  vacío da `{ cantidad: 0, subtotal: 0 }`.
- Sin tests de Vitest para `CarritoProvider` ni `BotonCarrito` — este repo no
  testea componentes React con Vitest (`vitest.config.ts` solo incluye
  `src/lib` y `src/db`); se verifica con `run-tienda` (`driver.mjs smoke` +
  captura del panel con items) como parte del plan de implementación.

---

## 6. Decisiones descartadas

- **Zustand** — la referencia (`ecom-myspace`) tampoco lo usa; sin patrón que
  portar 1:1, y agrega una dependencia nueva a un repo que hoy resuelve todo su
  estado de UI con Context.
- **Sin persistencia (solo memoria)** — se pierde el carrito al recargar la
  página; mala experiencia para una tienda con checkout de invitada, donde no
  hay cuenta que lo recupere.
- **Validar stock al agregar** — innecesario para este corte: la ficha ya
  desactiva tallas sin stock (`BarraCompra`), y la revalidación real pertenece
  al checkout, que ve el catálogo fresco de Postgres al confirmar.
