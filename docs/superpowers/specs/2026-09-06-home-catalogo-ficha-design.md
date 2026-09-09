# Home, catálogo y ficha — diseño

**Fecha:** 6 de septiembre de 2026
**Estado:** aprobado, listo para plan de implementación
**Referencia visual:** [femaleforce.com.co](https://femaleforce.com.co) — capturas en `assets/reference/femaleforce/`

---

## 1. Qué se construye y por qué

Hoy la tienda tiene una sola página: una home de fase 1 que existía para ver el
design system en contexto. No hay catálogo, no hay ficha, no hay producto.

Este trabajo construye **las tres plantillas del comercio** — home, catálogo y
ficha de producto — tomando de Female Force el ritmo de una tienda que vende, y
de NUDE la piel entera.

### Autoridad

`ecom/SPEC.md` manda. Female Force solo aporta donde el SPEC no había decidido o
había dejado el detalle visual abierto. Esta jerarquía se acordó explícitamente
antes de diseñar y resuelve todos los choques de una vez.

Consecuencia práctica: al bajar al detalle, el aporte real de la referencia se
redujo a **cuatro cosas**. Todo lo demás ya estaba resuelto en el SPEC.

| Aporte de Female Force | Dónde |
|---|---|
| Grilla UGC de comunidad | Home, bloque 8 |
| Iconografía de la franja de confianza | Home, bloque 7 |
| Miga de pan | Ficha |
| Medios de pago junto al precio | Ficha |

### Enfoque de composición

Los bloques de texto se alinean al **eje izquierdo** del SPEC §11.2 con margen
derecho generoso. Las bandas de foto — hero, tiles de categoría, grilla de
comunidad — van **a sangre**, sin contenedor, tocando el borde de la pantalla.

Ese contraste entre margen amplio y foto a borde es de donde Female Force saca su
fuerza, y se consigue sin centrar nada y sin tocar la identidad. La grilla de
producto sí se aprieta: gutter corto, para que se vea producto arriba del pliegue.

Se descartaron dos alternativas: meter todo dentro del contenedor de 1280px (se
lee como landing, que es el problema de la home actual) y el sangrado total tipo
Female Force (rompe el eje izquierdo, que es lo único que hoy distingue a NUDE de
una plantilla de Shopify).

---

## 2. Fundamentos

### 2.1 Datos de producto

No hay catálogo cargado y la fase 2 del SPEC §9.4 (Firestore + panel de admin) no
es parte de este trabajo. Catálogo y ficha se construyen contra un mock local.

**`src/content/productos.json`** — 6 a 8 referencias con el modelo del SPEC §6
exacto: `nombre`, `slug`, `categoria`, `coleccion`, `precio`, `descripcion`,
`detalles[]`, `variantes[{color, hex, talla, sku, stock}]`, `imagenes` por color,
`combina_con[]`, `estado`, `seo`.

**`src/lib/productos.ts`** — el adaptador. Expone:

```ts
listarProductos(opts: {
  categoria?: Categoria
  colores?: string[]
  tallas?: Talla[]
  precio?: { min?: number; max?: number }
  orden?: 'novedad' | 'precio-asc' | 'precio-desc'
  cursor?: string
}): Promise<{ productos: Producto[]; siguiente: string | null }>

obtenerProducto(slug: string): Promise<Producto | null>
destacados(limite?: number): Promise<Producto[]>
combinaCon(slug: string): Promise<Producto[]>
```

**Las cuatro funciones son `async` desde hoy**, aunque lean un JSON síncrono. Es
la decisión que hace que la fase 2 no duela: cuando el adaptador pase a Firestore,
cambia el cuerpo de estas cuatro funciones y ningún componente se toca.

Ningún componente importa `productos.json` directamente. Esa regla es lo que hace
cierta la promesa anterior.

### 2.2 Fotografía

Una sola foto existe en el repo: `assets/fotos/home-hero.png`, que contiene tres
tomas distintas de la misma sesión.

- **Hero, tiles de categoría y grilla de comunidad:** recortes 3:4 de esa foto.
  Legítimos — son tomas distintas.
- **Cards de producto y galería de ficha:** placeholder plano con el isotipo
  centrado, **dos variantes por producto** — una en Sahara y una en Cream. Sin la
  segunda no se puede verificar el cruce a la segunda foto de la card.

Todo placeholder vive en `assets/fotos/placeholder/` con un `README.md` que dice
que es desechable. La decisión abierta #5 del SPEC — fotografía de producto —
sigue siendo el cuello de botella real y este trabajo no la resuelve.

### 2.3 Utilidades nuevas en `globals.css`

Ninguna toca la paleta, la tipografía ni el radio de 2px.

| Clase | Qué hace |
|---|---|
| `.a-sangre` | Escapa del contenedor de 1280px y llega a los bordes de la pantalla |
| `.eje` | El eje izquierdo del §11.2 como grid: columna de texto de máx 640px + margen derecho |
| `.grid-producto` | 3 columnas desktop / 2 móvil, gutter corto |
| `.franja-iconos` | Fila de promesas con ícono Phosphor `light` en Ochre |
| `.barra-filtros` | Barra pegajosa bajo el header |
| `.barra-compra` | Barra fija inferior de la ficha en móvil |

### 2.4 Componentes nuevos

```
components/producto/CardProducto.tsx     imagen 3:4, cruce a segunda foto, nombre, precio, swatches
components/producto/GridProducto.tsx     la grilla + "Cargar más"
components/producto/Galeria.tsx          miniaturas verticales + principal; móvil: carrusel con puntos
components/producto/Filtros.tsx          color, talla, precio, orden; móvil abre panel inferior
components/producto/BarraCompra.tsx      barra fija inferior en móvil
components/home/TileCategoria.tsx        tile a sangre con nombre encima
components/home/Comunidad.tsx            grilla UGC
components/home/Newsletter.tsx           franja Sahara con captura de correo
```

Se reutilizan tal cual, sin modificar: `swatch`, `size-btn`, `accordion`,
`drawer`, `badge`, `btn-*`, `input`, `Reveal`, `TrazoColumna`, `FotoFondo`.

### 2.5 El trazo

El SPEC §11.1 promete que la línea Ochre de 1px acompaña la columna de producto y,
en la ficha, conecta la galería con el bloque de compra. Hoy solo baja por el hero
y marca los pilares. Este trabajo cumple la promesa:

- **Catálogo:** la línea baja por el margen izquierdo de la grilla.
- **Ficha:** baja por el borde izquierdo de la columna de compra, llevando la
  mirada de la foto al botón.

Es lo que la referencia no tiene y lo que impide que esto se lea como plantilla.

### 2.6 Renderizado

Home, catálogo y ficha son Server Components. Solo llevan `'use client'`:
`Filtros`, `Galeria`, `BarraCompra` y el selector de variantes de la ficha.

El estado inicial oculto de los `Reveal` se aplica solo con JS activo. Un catálogo
en `opacity: 0` por defecto es un catálogo que no existe en Google.

---

## 3. Home

Diez bloques. El 1 y el 10 ya están construidos.

| # | Bloque | Detalle |
|---|---|---|
| 1 | Anuncio + header | Ya construido. **El header se queda opaco**, no transparente sobre el hero como Female Force: el logo va en Umber y sobre foto clara se pierde |
| 2 | Hero | Foto a sangre, ~85vh. Una imagen, un mensaje, **sin carrusel**. Texto en HTML sobre el eje izquierdo, nunca quemado en el JPG. El trazo entra aquí |
| 3 | Manifiesto | Franja Umber, Cormorant itálica en Cream, centrado, máx 640px. Uno de los dos únicos momentos centrados del sitio |
| 4 | Categorías | Tres tiles a sangre: Leggings · Tops · Sets. Nombre encima de la foto. 3 columnas desktop, apiladas en móvil |
| 5 | Destacados | Grilla de 4 productos, **no carrusel** — el carrusel esconde producto. Título sobre el eje y "Ver todo" al final, que lleva a `/colecciones` |
| 6 | Los tres pilares | Suavidad · Movimiento · Confianza. Copy tal cual de la landing. El trazo marca cada columna |
| 7 | Franja de confianza | Envío a todo Colombia · Pago contra entrega · Cambios en 15 días. **Ícono Phosphor + título + una línea** — el tratamiento viene de la referencia |
| 8 | **Como la llevan** | Grilla UGC a sangre, 6 fotos, label `@nudesportswear.co`. Prueba social sin inventar reseñas |
| 9 | Captura de correo | Franja Sahara. "Sé la primera en enterarte": un input, un botón. En prelanzamiento el correo es el activo más valioso |
| 10 | Footer | Ya construido. Umber, 4 columnas |

---

## 4. Catálogo — `/leggings`, `/tops`, `/sets`

| # | Bloque | Detalle |
|---|---|---|
| 1 | Encabezado | Nombre de categoría en Cormorant sobre el eje izquierdo + párrafo de 2 líneas para SEO. Female Force lo centra; aquí no |
| 2 | Filtros | Color · Talla · Precio · Ordenar. Barra pegajosa bajo el header. En móvil abre panel inferior. Estado en la URL como query params, para que un filtro se pueda compartir y volver atrás funcione |
| 3 | Grilla | 3 columnas desktop, 2 móvil. Card 3:4 con cruce a la segunda foto en 300ms — sin zoom, sin sombra, sin levantar |
| 4 | Paginación | "Cargar más" sobre el eje izquierdo, no centrado. Sin scroll infinito: impide llegar al footer |

**Card de producto:** imagen 3:4 · nombre en Jost 400 14px mayúsculas `ls .1em` ·
precio en Jost 400 16px · swatches de 12px con borde Ochre. Badge arriba a la
izquierda solo si aplica: `ÚLTIMAS UNIDADES` (outline) o `AGOTADO` (sólido Umber).
Nunca porcentajes ni rojo.

**Los filtros son obligatorios desde el día uno.** El catálogo de la referencia no
los tiene y con varias referencias por varios colores se vuelve incómodo.

---

## 5. Ficha de producto — `/[categoria]/[slug]`

La página más importante del sitio.

**Desktop, dos columnas.** Izquierda: miniaturas verticales + imagen principal.
Derecha, pegajosa al hacer scroll, con el trazo bajando por su borde izquierdo:

| # | Elemento | Detalle |
|---|---|---|
| 0 | Miga de pan | Inicio › Leggings › Legging Duna. **Aporte de la referencia.** SEO y salida para quien cae desde Google |
| 1 | Nombre | Cormorant 400, 28px |
| 2 | SKU | Jost 11px mayúsculas en `--text-muted` |
| 3 | Precio | Jost 400, 22px. Sin tachados falsos |
| 4 | Medios de pago | **Contra entrega · Nequi · Bancolombia, justo bajo el precio.** Es el gesto de la referencia, no su contenido: allá va un widget de Addi, y NUDE no tiene Addi — el checkout es contra entrega y transferencia (SPEC §4.5). Se sube la información de pago a la altura del precio en vez de enterrarla al final |
| 5 | Color | Swatches circulares de 32px con el nombre del seleccionado al lado. Cambian la galería |
| 6 | Talla | XS · S · M · L · XL. Las agotadas se ven tachadas, **no desaparecen** |
| 7 | Guía de tallas | Link que abre panel lateral con la tabla de medidas |
| 8 | Inventario | "Últimas 3 unidades en talla S" **solo si es cierto**. Sin contadores, sin "12 personas viendo esto" |
| 9 | Agregar al carrito | Botón Umber sólido, ancho completo. Abre el panel lateral del §4.4 |
| 10 | Descripción | 3–5 líneas sensoriales: cómo se siente, no de qué está hecha |
| 11 | Detalles | Lista corta: composición, talle, bolsillo, cuidado |
| 12 | Acordeones | Envíos y entregas · Cambios y devoluciones · Cómo cuidar tu prenda |
| 13 | Completa el look | 4 productos de `combina_con[]` |

**Móvil:** galería a ancho completo con puntos, luego el bloque de compra en
vertical, y **barra fija inferior con precio + Agregar desde que entras**.

Female Force lo resuelve al revés: no tiene barra fija en la ficha y muestra una
barra negra inferior *después* de agregar, como confirmación. Aquí el botón nunca
se va de pantalla, y la confirmación es el panel lateral.

---

## 6. Lo que se descarta de la referencia

| Qué | Por qué |
|---|---|
| Hero carrusel | SPEC §4.1: una imagen, un mensaje. Dos slides es no haber decidido |
| Carruseles de producto | Esconden producto detrás de una flecha |
| Círculos de colección | Con 3 categorías y una colección, es navegación inventada |
| Reseñas | Sin ventas serían inventadas, y las inventadas se notan. Se activan cuando haya clientas reales |
| Quick view | Con 6–10 referencias no paga su complejidad |
| Selector de 1 a 7 columnas | Es una decisión de diseño delegada al cliente |
| Badges rojos de porcentaje | Rompen la paleta y el tono. Rojo está prohibido |
| Marquesina de SALE | Urgencia gritada |
| Burbuja flotante de WhatsApp | Tapa producto en móvil; el contacto vive en el footer y en la ficha |
| Texto quemado dentro del JPG del hero | Malo para SEO, malo para accesibilidad, obliga a rehacer el arte por cada cambio de copy |

---

## 7. Criterios de aceptación

**Estructura**
- Las tres plantillas existen y navegan entre sí: home → categoría → ficha → carrito.
- Ningún componente importa `productos.json`; todos pasan por `src/lib/productos.ts`.
- Las cuatro funciones del adaptador son `async`.

**Identidad**
- Cero hex sueltos en componentes. Todo por token.
- Cero grises, cero `#000`, cero `#FFF`, cero rojo, cero verde.
- Radio de 2px en todo; única excepción, el swatch circular.
- Sin sombras y sin `backdrop-filter`.
- Los únicos bloques centrados son el manifiesto y la confirmación de pedido.

**Accesibilidad y SEO** (SPEC §12)
- Contraste AA verificado en todo texto, incluido el que va sobre foto.
- Foco visible en Ochre, nunca eliminado.
- Toda imagen con `alt` descriptivo; todo ícono sin texto con `aria-label`.
- Área táctil mínima de 44×44.
- Con JS desactivado, catálogo y ficha se ven completos.
- `prefers-reduced-motion` respetado: el trazo aparece dibujado.

**Comportamiento**
- Los filtros viven en la URL: se comparten y el botón atrás funciona.
- Las tallas agotadas se ven tachadas, no ocultas.
- El inventario solo se muestra cuando es cierto.
- Sin scroll horizontal en ningún breakpoint.

---

## 8. Fuera de alcance

- Carrito y checkout (SPEC §4.4–4.5, fase 4).
- Firestore y panel de administración (fase 2).
- Fotografía de producto real (decisión abierta #5).
- Páginas de contenido: Nosotros, legales, guía de tallas como página.
- Buscador con resultados reales.
