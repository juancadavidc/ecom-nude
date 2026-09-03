# Referencia visual — camilaperezsport.com

Capturas de referencia para definir la estructura del e-commerce de NUDE SPORTSWEAR.

**Sitio:** https://camilaperezsport.com
**Capturado:** 26 de julio de 2026
**Plataforma detectada:** Shopify — tema **Impulse** (Archetype Themes)
**Método:** Playwright + Chrome. Desktop `1440×900` (@1x) · Mobile `390×844` (@2x, iPhone 13, UA de iOS Safari)

> Esto es referencia **estructural** (arquitectura de páginas, jerarquía, flujo de compra), no de estética.
> La paleta, tipografía e identidad de NUDE ya están cerradas y no se tocan. Camila Pérez usa blanco/negro
> con tipografía sans geométrica; NUDE usa Desert Dune. Lo que copiamos es el **esqueleto**, no la piel.

---

## Índice de imágenes

### Desktop (1440px)

| Archivo | Qué es | Para qué sirve |
|---------|--------|----------------|
| `desktop-01-home-fold.png` | Home, primer pantallazo (above the fold) | Header + hero. Lo primero que ve una clienta |
| `desktop-02-home-full.png` | Home completa, scroll entero (4863px) | **Clave** — el orden completo de secciones de la home |
| `desktop-03-nav-megamenu.png` | Menú "Colecciones" desplegado | Dropdown de colecciones (7 ítems) |
| `desktop-03b-nav-deportiva.png` | Menú "Ropa Deportiva" desplegado | Dropdown por tipo de prenda |
| `desktop-04-collection-fold.png` | Catálogo /leggings, above the fold | Título + descripción SEO + inicio de grilla |
| `desktop-05-collection-full.png` | Catálogo /leggings completo (3563px) | **Clave** — grilla de producto, 3 columnas |
| `desktop-06-pdp-fold.png` | Ficha de producto, above the fold | Galería + bloque de compra |
| `desktop-07-pdp-full.png` | Ficha de producto completa (3624px) | **Clave** — la página más importante del ecom |
| `desktop-08-cart-drawer.png` | Barra sticky tras "Agregar al carrito" | Feedback de añadido: barra negra inferior |
| `desktop-09-cart-page.png` | Página /cart con 1 producto | Layout del carrito y resumen |
| `desktop-10-search.png` | Buscador abierto (overlay) | Búsqueda ocupa toda la pantalla, fondo blanco |
| `desktop-11-quickview.png` | Quick view desde el catálogo | Modal de compra sin salir de la grilla |

### Mobile (390px / iPhone 13)

| Archivo | Qué es | Para qué sirve |
|---------|--------|----------------|
| `mobile-01-home-fold.png` | Home, primer pantallazo | Header centrado + hero + botón flotante "NAVEGACIÓN" |
| `mobile-02-home-full.png` | Home completa, scroll entero (3801px CSS) | **Clave** — cómo se reordenan las secciones en móvil |
| `mobile-03-nav-menu.png` | Menú principal abierto (panel negro) | Navegación móvil, 9 ítems |
| `mobile-03b-nav-submenu.png` | Submenú "Colecciones" dentro del panel | Navegación en 2 niveles con flecha de regreso |
| `mobile-04-collection-fold.png` | Catálogo /leggings, above the fold | Encabezado de categoría en móvil |
| `mobile-05-collection-full.png` | Catálogo /leggings completo (2485px CSS) | **Clave** — grilla móvil |
| `mobile-06-pdp-fold.png` | Ficha de producto, above the fold | Galería + título + precio |
| `mobile-07-pdp-full.png` | Ficha de producto completa (3590px CSS) | **Clave** — orden de bloques de la PDP móvil |
| `mobile-08-cart-drawer.png` | Barra sticky tras agregar al carrito | Feedback de añadido en móvil |
| `mobile-09-cart-page.png` | Página /cart con 1 producto | Carrito móvil |

---

## Lo que muestran las capturas

### Home — orden de secciones
Ver `desktop-02-home-full.png` y `mobile-02-home-full.png`.

1. **Header sticky** — logo a la izquierda (centrado en móvil), nav horizontal, iconos de cuenta y búsqueda. Sin ícono de carrito visible hasta que hay algo dentro.
2. **Hero carrusel** — banners de campaña a ancho completo con flechas laterales. Cada slide es una imagen con el texto ya quemado dentro (no es texto HTML).
3. **NEW ARRIVALS** — carrusel horizontal de producto. Card = imagen + nombre + precio. Nada más.
4. **COMPLEMENTOS PARA TUS LOOKS** — carrusel de accesorios (termos, medias). Aquí sí aparecen badges "Ahorra 36%" y precio tachado.
5. *(sección vacía — bug del sitio: muestra un placeholder en portugués. No replicar.)*
6. **TAMBIÉN PODRÍA INTERESARTE** — otro carrusel de producto.
7. **Grilla de categorías** — 10 tiles con foto y el nombre de la categoría encima (TOPS, BODYS & ENTERIZOS, SHORTS, LEGGINGS, CAMISETAS, FALDAS, ACCESORIOS, SUDADERAS & JOGGERS, BUZOS Y CHAQUETAS, ROPA MASCULINA). 4 columnas en desktop, 2 en móvil.
8. **Footer minimal** — 3 íconos sociales (Instagram, Facebook, TikTok), 3 links legales, copyright. Sin newsletter, sin columnas, sin mapa del sitio.

### Navegación
Desktop: `New Arrivals · Colecciones ▾ · Ropa Deportiva ▾ · Ropa Casual · Sale · Contacto` + cuenta + búsqueda.
Móvil: botón flotante negro "NAVEGACIÓN" fijo abajo → abre panel negro a pantalla completa con los mismos ítems + Inicio, Ingresar, Buscar. Los que tienen submenú abren un segundo nivel con flecha de regreso.

### Ficha de producto (PDP) — la más importante
Ver `desktop-07-pdp-full.png`.

Columna izquierda: miniaturas verticales + imagen principal grande.
Columna derecha, en este orden:
1. Título
2. Descripción corta (4–6 líneas)
3. Precio grande
4. **Widget de Addi** — "Paga con Addi en hasta 6 cuotas"
5. "Impuesto incluido"
6. **COLOR** — swatches circulares, con el nombre del color seleccionado en el label
7. **TALLA** — botones (aquí solo "TU" = talla única)
8. **Agregar al carrito** (botón outline) + **Comprar ahora** (botón negro sólido)
9. Cuatro acordeones: Información de envíos · Guía de tallas · Cambios y devoluciones · Métodos de pago
10. Grilla de logos de pago: Visa, Amex, Mastercard, Nequi, PSE, Mercado Pago, Addi, PayPal, Sistecrédito
11. **RESEÑAS** — 3 testimonios con estrellas, avatar genérico y nombre
12. **RECOMENDADOS PARA TI** — carrusel de producto
13. Footer

### Catálogo
Título de categoría centrado + párrafo descriptivo (SEO) + grilla. 3 columnas desktop, 2 móvil. Imagen vertical grande, nombre y precio debajo. **No tiene filtros ni orden** — solo la grilla. Hay **quick view** al pasar el mouse (`desktop-11-quickview.png`): abre un modal con galería, color, talla y ambos botones de compra sin salir del catálogo.

### Carrito
Al agregar no se abre un panel lateral, aparece una **barra negra fija abajo**: "1 artículos · $155.000 · Finalizar pedido". La página `/cart` es una tabla simple: producto, variantes, cantidad ±, total, subtotal, "Finalizar pedido" y "Continuar la compra".

---

## Notas para el spec de NUDE

**Lo que vale la pena copiar:**
- La estructura de la PDP casi completa — es el estándar de ecom de moda en Colombia y funciona.
- Métodos de pago colombianos visibles en la ficha (Addi, Nequi, PSE, Mercado Pago, Sistecrédito). Esto es tabla estacas para vender en Colombia.
- Financiación a cuotas visible junto al precio: baja la fricción en un ticket de $80.000–$160.000.
- Menú móvil como botón flotante fijo — siempre alcanzable con el pulgar.
- Grilla de categorías en la home como navegación visual.
- Acordeones de envíos / tallas / devoluciones: resuelven las 3 dudas que llegan por DM.

**Lo que NO copiar:**
- El catálogo sin filtros ni orden. Con 6+ referencias y varios colores se vuelve incómodo. NUDE debe tener filtro por categoría, color y talla desde el día uno.
- El footer vacío. Es una oportunidad perdida: ahí va la captura de correo, que para NUDE es crítica en prelanzamiento.
- Las reseñas con avatar genérico gris — se leen como inventadas. NUDE debería usar foto real o solo texto.
- La sección rota con placeholder en portugués.
- El hero con texto quemado dentro de la imagen: malo para SEO, malo para accesibilidad y obliga a rehacer el arte por cada idioma o cambio de copy.

**Diferencia de fondo:** Camila Pérez tiene 11 categorías incluyendo ropa masculina. NUDE arranca con leggings y tops. La arquitectura debe ser más simple — probablemente 3 o 4 categorías, no 11.

---

## Cómo regenerar estas capturas

Requiere Node y Chrome instalados. Playwright usa el Chrome del sistema con `--channel chrome`
(los binarios propios de Playwright en caché están desactualizados).

```bash
# Captura suelta y rápida
npx playwright screenshot -b chromium --channel chrome \
  --viewport-size=1440,900 --wait-for-timeout=3000 \
  "https://camilaperezsport.com" salida.png
```

Para páginas completas: **no usar `--full-page`** en este sitio. Las secciones de Shopify cargan
por scroll y salen en blanco. El método que funciona es abrir con un viewport alto (ej. `1440×5200`)
para que todo entre en pantalla y renderice, y luego recortar el screenshot a la altura real del footer.

Los scripts que generaron todo esto quedaron en `scripts/`:

| Script | Qué hace |
|--------|----------|
| `scripts/capture.js` | Recorrido completo: home, catálogo, PDP, agregar al carrito y página de carrito, en desktop y móvil |
| `scripts/capture-nav2.js` | Menús desplegables (desktop y móvil) + quick view del catálogo |
| `scripts/capture-fit.js` | Páginas completas con la técnica de viewport alto + recorte al footer |

```bash
cd assets/reference/scripts
npm init -y && npm i playwright   # solo el paquete, no descarga navegadores
node capture.js
```

