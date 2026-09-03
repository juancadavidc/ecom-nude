# SPEC — E-commerce NUDE SPORTSWEAR

**Versión:** 1.2
**Fecha:** 26 de julio de 2026
**Estado:** Marca, arquitectura, páginas, plataforma y arquitectura técnica definidas.

**Decisiones tomadas:** plataforma = software a la medida (§9) · envío calculado en checkout, sin envío gratis (§4.5) · uso de Ochre resuelto (§2.1) · logos exportados a SVG (§2.3).

---

## 1. Alcance de la v1

Tienda en línea con catálogo, carrito y checkout propio. La clienta completa la compra sola, sin pasar por DM.

**Pago:** contra entrega **o** transferencia (Nequi / Bancolombia). No hay pasarela de tarjeta en la v1 — eso elimina la integración más pesada y permite lanzar mucho antes.

**Fuera de alcance en la v1:** cuentas de usuario, lista de deseos, reseñas, blog, cupones automáticos más allá de `SECONDSKIN`, multi-idioma, envíos internacionales.

**Referencia estructural:** `assets/reference/` — capturas de camilaperezsport.com con el desglose de cada página. Se copia el **esqueleto** de e-commerce, nunca la estética.

---

## 2. Fundamentos de marca aplicados a web

Todo sale de `CLAUDE.md` y de lo ya construido en `landing/`. No se inventa nada nuevo.

### 2.1 Color — Desert Dune

| Token | Hex | Uso en el sitio |
|-------|-----|-----------------|
| `--cream` | `#F6EBDE` | Fondo principal de todo el sitio |
| `--white` | `#FDFAF6` | Fondo de tarjetas, inputs, superficies elevadas |
| `--sahara` | `#EDD5B8` | Fondos de sección alternos, placeholder de imagen, estados deshabilitados |
| `--dune` | `#DEB68E` | Texto secundario sobre Umber, bordes sobre oscuro |
| `--ochre` | `#C4956A` | Bordes, líneas, íconos, hover, focus ring, detalles |
| `--umber` | `#5C3D28` | **Todo el texto.** Botones primarios, footer, secciones oscuras |

**Regla de contraste — no negociable.** Verificado contra WCAG AA:

| Combinación | Ratio | Veredicto |
|-------------|-------|-----------|
| Umber sobre Cream | 8.29:1 | ✅ |
| Umber sobre White | 9.37:1 | ✅ |
| Umber sobre Sahara | 6.88:1 | ✅ |
| Cream sobre Umber | 8.29:1 | ✅ |
| Dune sobre Umber | 5.20:1 | ✅ |
| **`--text-muted` sobre Sahara** | **4.10:1** | ❌ **no pasa AA** |
| **Ochre sobre Cream** | **2.27:1** | ❌ **ilegible** |
| **Ochre sobre White** | **2.57:1** | ❌ **ilegible** |
| **Dune sobre White (placeholder)** | **1.87:1** | ❌ **ilegible** |

> **Corregido en la implementación (fase 1).** Las dos últimas filas son fallas que esta tabla
> no cubría en la v1.2 y que aparecieron al construir el design system:
>
> 1. **`--text-muted` sobre Sahara da 4.10:1.** La tabla lo verificaba solo contra Cream. En
>    cualquier bloque con fondo Sahara el texto secundario vuelve a Umber pleno (6.88:1). Se
>    resuelve con la clase de superficie `.on-sahara`, que redefine el token en ese contexto —
>    no poniendo `bg-sahara` a mano, que se salta la corrección.
> 2. **"Placeholder en Dune" (§5) da 1.87:1.** §12 marca el contraste como crítico y gana: el
>    placeholder usa `--text-muted` (5.58:1 sobre White) y se distingue del valor real por peso
>    (200 vs 300), no por color. La etiqueta siempre está visible, así que el placeholder nunca
>    hace de etiqueta.

**Resolución del problema de Ochre.** Consideré tres caminos: oscurecer Ochre (agrega un color a una paleta cerrada — descartado), usarlo igual y aceptar el problema (descartado, deja fuera a quien lee con el celular al sol), o **separar el rol del color del rol del texto**. Este último es el correcto y es el que queda:

```css
--text          #5C3D28   /* Umber — títulos y cuerpo            8.29:1 */
--text-muted    #7B604C   /* Umber al 80% sobre Cream            4.93:1 */
--line          #C4956A   /* Ochre — bordes, reglas, íconos, focus       */
--line-soft     rgba(196,149,106,0.25)
```

`--text-muted` no es un color nuevo: es Umber mezclado con el fondo, medido hasta encontrar el punto exacto donde todavía pasa AA. Al 75% ya falla (4.39:1); el 80% es el mínimo que sirve. Da la jerarquía visual que la marca busca sin sacrificar legibilidad.

> **Ochre nunca es color de texto sobre fondo claro.** Es línea, borde, ícono, hover y anillo de foco.
> Sobre Umber sí funciona para texto grande (3.65:1), nunca para cuerpo.
>
> ⚠️ La landing actual (`landing/landing-page/`) usa Ochre para texto pequeño sobre Cream
> (`.cta-label`, `.cta-note`, `.cta-subtitle`). Hay que corregirlo allá con estos mismos tokens.

La paleta no se amplía. Grises, negros puros y blancos puros están prohibidos: `#000` y `#FFF` rompen la calidez. Los bordes son Ochre al 25%, nunca gris. Para errores no se usa rojo: borde Ochre sólido + texto Umber + ícono. El rojo es el único color que rompería Desert Dune, y un error no necesita gritar para entenderse.

### 2.2 Tipografía

Se mantiene el sistema que ya vive en la landing y el brand sheet:

| Fuente | Rol | Pesos |
|--------|-----|-------|
| **Jost** | Interfaz completa: cuerpo, botones, labels, precios, formularios, navegación | 200, 300, 400, 500 |
| **Cormorant Garamond** | Solo display: títulos de sección, tagline, manifiesto, nombre de producto en la ficha | 300, 400 + itálica |

**Cormorant es la voz emocional, Jost es la voz funcional.** Un precio nunca va en serif. Un manifiesto nunca va en sans.

Escala:

```
Display XL   Cormorant 300   clamp(40px, 7vw, 72px)   line-height 1.1
Display L    Cormorant 300   clamp(32px, 5vw, 52px)   line-height 1.2
Título       Cormorant 300   clamp(24px, 3vw, 36px)   line-height 1.3
Nombre prod  Cormorant 400   24px
Cuerpo       Jost 300        16px                     line-height 1.7
Cuerpo S     Jost 300        14px                     line-height 1.6
Precio       Jost 400        22px                     letter-spacing 0.02em
Label        Jost 400        11px  MAYÚSCULAS         letter-spacing 0.4em
Botón        Jost 400        12px  MAYÚSCULAS         letter-spacing 0.3em
```

### 2.3 Logo

Los tres logos oficiales están en `branding/logos-oficiales/`. **Se usan como archivo, nunca se recrean con fuentes.**

**Resuelto: ya existen los SVG.** Se extrajeron del PDF vectorial oficial de Croma Visual (`vectores/NUDE-Logos-Vectorial.pdf`, 30 páginas) con `pdftocairo`, se les quitó el fondo, se ajustó el `viewBox` al trazo real y se dejaron en `currentColor`:

| Archivo | Qué es | Peso |
|---------|--------|------|
| `assets/brand/nude-isotipo.svg` | Isotipo — N caligráfica con punto | 2.2 KB |
| `assets/brand/nude-wordmark.svg` | Wordmark "NUDE" + "SPORTSWEAR" | 13 KB |

Son trazos vectoriales reales, no imágenes rasterizadas: 2 paths el isotipo, 14 el wordmark. Verificado a 96, 48, 32, 24 y 16px sobre Cream y sobre Umber — el isotipo aguanta hasta 16px sin ensuciarse.

Al estar en `currentColor` **un solo archivo sirve para cualquier color de la paleta**: se controla desde CSS con `color`. No hay que mantener versión positiva y negativa por separado.

```html
<span style="color: var(--text)">      <!-- Umber sobre Cream -->
<span style="color: var(--cream)">      <!-- Cream sobre Umber -->
```

| Ubicación | Archivo | Color |
|-----------|---------|-------|
| Header | `nude-wordmark.svg`, alto 22px | `--text` |
| Footer | `nude-wordmark.svg`, alto 32px | `--cream` |
| Favicon y pestaña | `nude-isotipo.svg` | `--text` |
| Loader, watermark, correos | `nude-isotipo.svg` | según fondo |

> ⚠️ La landing actual escribe "NUDE" como texto HTML en Cormorant Garamond — recrea el wordmark
> con otra fuente, justo lo que el brand sheet prohíbe: *"el wordmark siempre en su tipografía oficial"*.
> Con los SVG ya disponibles, corregirlo allá es reemplazar un `<h1>` por un `<svg>`.

El `.ai` sigue siendo la fuente maestra para impresión. Los SVG son derivados de web y se regeneran del PDF si el estudio entrega una versión nueva.

### 2.4 Espacio, forma y movimiento

- **Aire generoso.** Secciones con 96–140px de padding vertical en desktop, 64–80px en móvil. El espacio en blanco es parte del producto.
- **Radio de esquina: 2px.** Casi recto. Nada de esquinas redondeadas tipo app.
- **Sin sombras.** La separación se hace con color de fondo y línea Ochre al 25%. Una sombra dura rompe el minimalismo cálido.
- **Ancho máximo de contenido: 1280px.** Texto corrido: 640px.
- **Transiciones de 0.3s ease.** Fades y desplazamientos de 1–4px. Nada rebota, nada gira, nada hace zoom brusco.

**Filtro:** *"Si no se siente como arena tibia bajo los pies, no es NUDE."* Aplica también a una animación.

---

## 3. Arquitectura de información

NUDE arranca con leggings y tops. Camila Pérez tiene 11 categorías; copiar eso nos deja un menú con más ramas que producto.

```
Inicio
├── Leggings
├── Tops
├── Sets              ← legging + top juntos. Ticket más alto, empuja el promedio
├── Colección         ← la primera colección con nombre propio (editorial, no catálogo)
└── Nosotras          ← historia de marca. Es lo que justifica el precio

Utilidades: Buscar · Carrito
Pie: Guía de tallas · Envíos y entregas · Cambios y devoluciones · Contacto · Legales
```

Tres categorías de producto y dos de contenido. Si más adelante entran accesorios o una segunda línea, se agregan; no se dejan ramas vacías esperando.

**Sin cuentas de usuario en la v1.** Checkout de invitada. Menos fricción, menos código, menos datos personales que custodiar.

---

## 4. Páginas

### 4.1 Home

| # | Bloque | Detalle |
|---|--------|---------|
| 1 | **Header** | Fijo. Logo (Principal 2) a la izquierda, nav centrada, buscar + carrito a la derecha. Fondo Cream, línea Ochre 25% abajo. En móvil: logo centrado, hamburguesa izquierda, carrito derecha |
| 2 | **Hero** | Imagen a ancho completo, alto ~85vh. **El texto va en HTML sobre la imagen, nunca quemado dentro del JPG.** Título en Cormorant, un solo botón. Sin carrusel — una sola imagen, un solo mensaje |
| 3 | **Manifiesto** | Franja Umber. Texto Cormorant itálica en Cream, centrado, máx 640px. Es el bloque que dice por qué NUDE existe |
| 4 | **Categorías** | Tres tiles grandes: Leggings · Tops · Sets. Foto + nombre encima. 3 columnas desktop, 1 columna apilada en móvil |
| 5 | **Destacados** | 4 productos en grilla (no carrusel — el carrusel esconde producto). "Ver todo" al final |
| 6 | **Los tres pilares** | Suavidad · Movimiento · Confianza. Ya escritos en la landing, se reutiliza el copy tal cual |
| 7 | **Franja de confianza** | Envío a todo Colombia · Pago contra entrega · Cambios en 15 días. Íconos de línea Ochre |
| 8 | **Captura de correo** | Fondo Sahara. "Sé la primera en enterarte". Un input, un botón |
| 9 | **Footer** | Fondo Umber. Logo Principal negativo, 3 columnas de links, Instagram + WhatsApp, copyright |

> **Diferencia deliberada con la referencia:** Camila Pérez tiene un footer con 3 íconos y 3 links,
> y sin captura de correo. Para NUDE el correo es el activo más valioso en prelanzamiento — va en la home y en el footer.

### 4.2 Catálogo (Leggings / Tops / Sets)

| # | Bloque | Detalle |
|---|--------|---------|
| 1 | **Encabezado** | Nombre de categoría en Cormorant + párrafo de 2 líneas. Sirve para SEO y para dar tono |
| 2 | **Filtros y orden** | Barra fija: Color · Talla · Precio · Ordenar por. En móvil abre panel inferior |
| 3 | **Grilla** | 3 columnas desktop, 2 en móvil. Imagen vertical 3:4 |
| 4 | **Paginación** | "Cargar más". Nada de scroll infinito — impide llegar al footer |

**Los filtros son obligatorios desde el día uno.** El catálogo de Camila Pérez no los tiene y con varias referencias × varios colores se vuelve incómodo de recorrer.

**Card de producto:**
```
┌──────────────────┐
│                  │  Imagen 3:4. Al pasar el mouse cambia a la segunda foto.
│     imagen       │  Sin zoom, sin sombra. Fade de 0.3s.
│                  │  Badge "Agotado" o "Últimas unidades" arriba a la izquierda
├──────────────────┤  si aplica — nunca "¡OFERTA!" ni porcentajes gritados
│ LEGGING DUNA     │  Jost 400, 14px, mayúsculas, letter-spacing 0.1em
│ $145.000         │  Jost 400, 16px
│ ● ● ●            │  Swatches de color, 12px, borde Ochre
└──────────────────┘
```

Sin quick view en la v1. Suma complejidad y con 6–10 referencias no hace falta.

### 4.3 Ficha de producto (PDP)

La página más importante del sitio. Aquí se decide la compra.

**Desktop — dos columnas.** Izquierda: galería (miniaturas verticales + imagen principal, zoom al hacer clic). Derecha, pegajosa al hacer scroll:

| # | Elemento | Detalle |
|---|----------|---------|
| 1 | Nombre | Cormorant 400, 28px |
| 2 | Precio | Jost 400, 22px. Sin tachados falsos |
| 3 | **Color** | Swatches circulares 32px con el nombre del seleccionado al lado. Cambian la galería |
| 4 | **Talla** | XS · S · M · L · XL en botones. Agotadas se ven tachadas, no desaparecen |
| 5 | Link "Guía de tallas" | Abre panel lateral con la tabla de medidas |
| 6 | Estado de inventario | "Últimas 3 unidades" solo si es cierto. Nunca urgencia falsa |
| 7 | **Agregar al carrito** | Botón Umber sólido, ancho completo |
| 8 | Descripción | 3–5 líneas. Sensorial, no técnica: cómo se siente, no de qué está hecha |
| 9 | Detalles | Lista corta: composición, cintura alta, con o sin bolsillo, cuidado |
| 10 | **Acordeones** | Envíos y entregas · Cambios y devoluciones · Cómo cuidar tu prenda |
| 11 | Medios de pago | Íconos de contra entrega, Nequi, Bancolombia |
| 12 | **Completa el look** | 3–4 productos que combinan. Aquí sube el ticket promedio |

**Móvil:** galería a ancho completo con puntos, luego el bloque de compra en orden vertical. **Barra fija inferior** con precio + "Agregar al carrito" siempre visible.

**No hay reseñas en la v1.** Sin ventas todavía, cualquier reseña sería inventada — y las inventadas se notan. Se activan cuando haya clientas reales.

### 4.4 Carrito

Panel lateral que se abre al agregar (no una página aparte, no una barra inferior como la referencia).

Contiene: miniatura, nombre, color, talla, cantidad ±, precio, eliminar. Subtotal, nota de que el envío se calcula en el siguiente paso, botón "Finalizar compra" y link "Seguir viendo".

Carrito vacío: isotipo, *"Todavía no has elegido nada."*, botón "Ver leggings". Nunca "Tu carrito está vacío 😢".

### 4.5 Checkout — pago contra entrega y transferencia

Una sola página, cuatro bloques, sin distracciones. **El header pierde la navegación**: solo el logo. Cada salida es una venta perdida.

**Bloque 1 — Contacto:** nombre completo, celular (WhatsApp), correo.

**Bloque 2 — Entrega:** departamento y ciudad (lista desplegable, no texto libre), dirección, barrio, indicaciones adicionales.

**El costo de envío se calcula al elegir la ciudad**, no antes. No hay envío gratis en ninguna modalidad.

| Zona | Tarifa | Parámetro |
|------|--------|-----------|
| Área metropolitana | **$14.000** | `SHIPPING_METRO` |
| Fuera del área metropolitana | **$20.000** | `SHIPPING_NACIONAL` |

Ambas tarifas son **parametrizables desde el panel de administración**, sin tocar código ni volver a desplegar. La lista de ciudades del área metropolitana también es editable — cuando cambie la transportadora o la cobertura, se ajusta ahí mismo.

```
Modelo de datos
─────────────────────────────────────────
shipping_rates: {
  metro:     { valor: 14000, activo: true }
  nacional:  { valor: 20000, activo: true }
}
metro_ciudades: ["Medellín", "Envigado", "Itagüí", "Sabaneta",
                 "Bello", "La Estrella", "Caldas", "Copacabana", …]
```

El sitio muestra el costo en cuanto la clienta elige ciudad, con el texto del subtotal actualizándose en vivo. Nunca aparece "envío por calcular" en el resumen final: se llega al botón de confirmar sabiendo el total exacto.

**Bloque 3 — Pago:**

```
○  Transferencia   —  Nequi o Bancolombia
   Te mostramos los datos al confirmar. Envías el comprobante
   por WhatsApp y despachamos el mismo día.

○  Pago contra entrega
   Pagas en efectivo cuando recibas.
```

> **Nota operativa —** el contra entrega en Colombia devuelve una porción alta de los pedidos y
> en cada devolución NUDE paga el flete de ida y de vuelta sin haber vendido. Como el envío se
> cobra siempre y no hay incentivo de precio hacia la transferencia, el control tiene que ser
> operativo, no de diseño: confirmar cada pedido contra entrega por WhatsApp antes de despacharlo.
> Un pedido confirmado por voz o mensaje devuelve mucho menos que uno despachado a ciegas.
> El panel debe permitir marcar un pedido como **confirmado** antes de pasarlo a despachado.

**Bloque 4 — Resumen y confirmación:** productos, subtotal, envío, total, campo de código de descuento (`SECONDSKIN`), botón "Confirmar pedido".

**Página de confirmación:**
- Número de pedido
- **Si eligió transferencia:** datos de la cuenta en grande, monto exacto, y un botón "Enviar comprobante por WhatsApp" que abre WhatsApp con el número de pedido ya escrito
- **Si eligió contra entrega:** cuándo llega y cuánto tener listo en efectivo
- Copy de bienvenida en la voz de la tarjeta de agradecimiento

**Correos automáticos:** confirmación de pedido, pago recibido (transferencia), pedido despachado con guía. Todos con logo oficial, fondo Cream, texto Umber.

### 4.6 Páginas de contenido

| Página | Contenido |
|--------|-----------|
| **Nosotras** | La historia de Daniela y de la marca. Es lo que sostiene un precio premium. Formato editorial: foto grande, texto en Cormorant, mucho aire |
| **Guía de tallas** | Tabla de medidas + cómo medirse. Va también como panel lateral desde la PDP |
| **Envíos y entregas** | Cobertura, tiempos por ciudad, costos, transportadora |
| **Cambios y devoluciones** | Plazo, condiciones, cómo se solicita |
| **Contacto** | WhatsApp, correo, Instagram. Sin formulario — el DM ya funciona |
| **Legales** | Términos, tratamiento de datos (Ley 1581, obligatorio en Colombia) |
| **404** | Isotipo, *"Esta página se movió."*, botón al catálogo |

---

## 5. Componentes

**Botón primario:** fondo Umber, texto Cream, Jost 400 12px mayúsculas, tracking 0.3em, padding 16×32, radio 2px. Hover: fondo Ochre + `translateY(-1px)`.

**Botón secundario:** transparente, borde Umber 1px, texto Umber. Hover: fondo Umber, texto Cream.

**Input:** fondo White, borde Sahara 1px, radio 2px, padding 16×20, Jost 300 15px. Focus: borde Ochre. Placeholder en Dune. Error: borde Ochre + mensaje debajo en Umber (nunca rojo — rompe la paleta).

**Swatch de color:** círculo 32px, borde Ochre 1px. Seleccionado: anillo Umber 2px con 3px de separación.

**Botón de talla:** rectángulo 48×40, borde Ochre 30%. Seleccionado: fondo Umber, texto Cream. Agotado: tachado, opacidad 40%, no clicable.

**Acordeón:** título Jost 400 13px mayúsculas tracking 0.2em, chevron a la derecha, línea Ochre 25% arriba. Todos cerrados por defecto.

**Nav móvil:** panel desde la izquierda, fondo Umber, texto Cream, ítems Jost 300 18px. Dos niveles con flecha de regreso.

> La referencia usa un botón flotante fijo "NAVEGACIÓN" abajo — se alcanza con el pulgar y es
> buena idea de usabilidad, pero un rectángulo negro permanente sobre el contenido rompe el aire
> que define a NUDE. Aquí se resuelve con hamburguesa en el header fijo.

---

## 6. Modelo de contenido — Producto

```
nombre                 "Legging Duna"
slug                   legging-duna
categoría              leggings | tops | sets
colección              nombre de la colección
precio                 COP, entero
descripción            3–5 líneas sensoriales
detalles[]             composición, talle, bolsillo, cuidado
variantes[]            { color, hex, talla, sku, stock }
imágenes[]             por color, mínimo 4 (frente, espalda, detalle, lifestyle)
combina_con[]          referencias de productos
estado                 activo | agotado | próximamente
seo                    título, descripción, alt de imágenes
```

**Fotografía — mínimos no negociables:** fondo Cream o Sahara, luz natural cálida y lateral, sin flash directo, relación 3:4, mínimo 1600px de ancho, formato WebP. Toda foto lleva `alt` descriptivo — accesibilidad y SEO.

---

## 7. Voz aplicada al comercio

Aquí es donde la mayoría de tiendas pierde el tono: el catálogo se cuida, los botones y los errores se abandonan.

| Situación | NUDE dice | NUDE no dice |
|-----------|-----------|--------------|
| Agregar | "Agregar al carrito" | "¡LO QUIERO!" |
| Agregado | "Listo. Está en tu carrito." | "¡Añadido con éxito! 🎉" |
| Agotado | "Agotado por ahora" | "SIN STOCK" |
| Carrito vacío | "Todavía no has elegido nada." | "Tu carrito está vacío 😢" |
| Confirmación | "Recibimos tu pedido." | "¡GRACIAS POR TU COMPRA!" |
| Error de campo | "Nos falta tu celular para coordinar la entrega." | "Campo obligatorio" |
| Envío | "Llega en 2 a 4 días hábiles." | "¡ENVÍO SÚPER RÁPIDO!" |
| Newsletter | "Sé la primera en enterarte." | "¡Suscríbete y no te lo pierdas!" |

Sin emojis en la interfaz. Sin signos de exclamación. Sin contadores regresivos, sin "12 personas están viendo esto", sin ruedas de descuento. La urgencia falsa es exactamente lo contrario a *confianza silenciosa*.

---

## 8. Rendimiento y técnica

- **LCP bajo 2.5s en 4G.** La clienta llega desde Instagram, en celular, con señal irregular
- Imágenes en WebP, `srcset` por breakpoint, lazy salvo el hero
- Fuentes: solo los pesos que se usan, `font-display: swap`, precargadas
- Móvil primero. **Más del 80% del tráfico va a venir de Instagram**
- Área táctil mínima 44×44px
- HTML semántico, navegación por teclado, focus visible en Ochre
- Analítica: Meta Pixel + Google Analytics 4. Sin píxeles de terceros que no se usen

---

## 9. Plataforma y arquitectura técnica

**Decisión: software a la medida.** Recomendé Shopify por tiempo de lanzamiento; Daniela optó por desarrollo propio y esa es la decisión que ejecuta este spec. Los productos se cargan de forma progresiva, así que el panel de administración es parte del alcance de la v1, no un añadido posterior.

### 9.1 Stack

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | **Next.js (App Router) + TypeScript** | Renderizado en servidor para SEO real en catálogo y fichas. Un SPA de Vite no se indexa bien y aquí Google importa |
| Estilos | **Tailwind** con los tokens de §2 como variables CSS | Mismo stack que la app de finanzas |
| Datos | **Firestore** | Ya lo manejan. Tiempo real gratis para inventario |
| Imágenes | **Firebase Storage** + `next/image` | Conversión a WebP y `srcset` automáticos |
| Auth | **Firebase Auth**, solo para el panel | La tienda no tiene cuentas de clienta |
| Lógica de servidor | **Cloud Functions** | Descuento de inventario, correos, numeración de pedidos |
| Correos | **Resend** o extensión Trigger Email | Confirmación, pago recibido, despachado |
| Hosting | **Firebase Hosting** | Mismo proyecto y flujo de despliegue que el resto |

> **Advertencia honesta:** este camino cuesta más tiempo antes de la primera venta que Shopify.
> A cambio se gana control total del diseño y cero mensualidad. Es una decisión legítima —
> pero implica que el sitio no puede ser lo único en la ruta crítica: la producción, las fotos
> y el contenido de Instagram tienen que avanzar en paralelo, no esperando al sitio.

### 9.2 Colecciones de Firestore

```
productos/{id}          ver el modelo de §6
  variantes[]           { color, hex, talla, sku, stock }
pedidos/{id}
  numero                NUDE-0001, consecutivo
  items[]               { productoId, nombre, color, talla, precio, cantidad }
  cliente               { nombre, celular, email }
  entrega               { departamento, ciudad, direccion, barrio, indicaciones }
  envio                 { zona: metro|nacional, valor }
  pago                  { metodo: transferencia|contraentrega, comprobanteUrl? }
  estado                nuevo → confirmado → pagado → despachado → entregado | cancelado
  totales               { subtotal, envio, descuento, total }
  creado, actualizado
config/tienda
  shipping_rates, metro_ciudades, cuenta_bancaria,
  codigos_descuento, tallas, whatsapp, anuncio_barra
suscriptores/{email}    captura de correo
```

**Reglas de seguridad:** `productos` y `config` son de lectura pública y escritura solo para la allowlist. `pedidos` **no se lee ni se escribe desde el cliente** — se crean por Cloud Function, que es también donde se valida el precio. Si el precio se calcula en el navegador, cualquiera lo edita y compra un legging por $1.000.

### 9.3 Panel de administración — `/admin`

Es la pieza que Shopify daba gratis y aquí hay que construir. Sin esto Daniela no puede operar.

| Pantalla | Qué permite |
|----------|-------------|
| **Productos** | Crear, editar, publicar y despublicar. Subir imágenes con arrastrar y soltar, reordenarlas |
| **Inventario** | Stock por combinación de color y talla. Edición rápida en tabla |
| **Pedidos** | Lista por estado. Ver detalle, ver comprobante, cambiar estado, registrar número de guía |
| **Configuración** | Tarifas de envío, ciudades del área metropolitana, datos bancarios, códigos de descuento, barra de anuncio |
| **Suscriptoras** | Lista de correos, exportar a CSV |

Acceso con Google SSO y allowlist de correos, exactamente el mismo patrón que ya funciona en `finanzas/app`. Se reutiliza el código de autenticación.

### 9.4 Orden de construcción

| Fase | Entrega | Por qué en ese orden |
|------|---------|----------------------|
| 1 | ✅ **Hecha** — Design system: tokens, tipografía, botones, inputs, header, footer | Todo lo demás se apoya en esto. Código en `tienda/`, estado y decisiones en `tienda/README.md`. Verificar en `/sistema` |
| 2 | Modelo de datos + panel de productos e inventario | Daniela puede empezar a cargar producto mientras se construye la tienda |
| 3 | Catálogo y ficha de producto | Ya hay contenido real que mostrar |
| 4 | Carrito y checkout + Cloud Functions de pedido | El flujo de venta completo |
| 5 | Panel de pedidos + correos | Operación |
| 6 | Home, Nosotras, páginas de contenido, SEO | Lo que se puede pulir mientras ya se vende |

La fase 2 va antes que la tienda a propósito: la carga de producto es trabajo de Daniela y no depende de que el sitio esté terminado. Ponerla primero permite que las dos cosas avancen en paralelo en vez de en fila.

### 9.5 Reglas de Next.js

| Regla | Hacer | No hacer | Severidad |
|-------|-------|----------|-----------|
| Imágenes | `<Image>` de `next/image` — optimiza y hace lazy solo | `<img>` directo | Alta |
| Renderizado | Server Components por defecto | `'use client'` sin necesidad | Alta |
| Metadatos | `export const metadata = {}` | Etiquetas `<head>` manuales | Media |

Solo llevan `'use client'`: carrito, selector de variantes, filtros de catálogo, formulario de checkout y el panel de administración. **Catálogo y ficha se renderizan en servidor** — de ahí sale el SEO, y una tienda de moda que no aparece en Google depende para siempre de pagar tráfico.

**Trampa a evitar en las animaciones de entrada.** Si el contenido arranca en `opacity: 0` y se revela con JavaScript, el rastreador de Google puede indexar una página vacía. El estado oculto se aplica **solo cuando hay JS activo** — una clase en `<html>` puesta por script — de modo que sin JavaScript todo se ve. Aplica al catálogo, a la ficha y a cualquier bloque con texto que importe para búsqueda.

### 9.6 Íconos

**Phosphor Icons**, peso `light`, 20px, color `--line`. Su trazo fino es lo más cercano al isotipo — un ícono de trazo grueso al lado del logo se ve prestado de otra marca.

```tsx
import { ShoppingCart, List, ArrowLeft, X, MagnifyingGlass } from '@phosphor-icons/react'
<ShoppingCart size={20} weight="light" aria-label="Carrito" />
```

---

## 10. Fuentes de diseño consultadas

Se corrió `ui-ux-pro-max` sobre el brief (e-commerce de moda deportiva femenina, minimalismo cálido) con los diales en variance 6, motion 3, density 2. Lo que devolvió y qué se hizo con cada cosa:

| Recomendación | Decisión |
|---------------|----------|
| Tipografía **Cormorant + Montserrat** para moda y lujo | ✅ **Confirma el sistema actual.** NUDE ya usa Cormorant Garamond + Jost. Jost es geométrica tipo Futura, más alineada con la decisión cerrada #4 que Montserrat. Se mantiene Jost |
| **Scroll reveal sutil** — 300-400ms, `power1.out`, desplazamiento de 12px | ✅ **Adoptado.** Coincide con el 0.3s ya definido |
| Checklist de accesibilidad y formularios | ✅ **Adoptado completo** — ver §11 |
| Estilo **Liquid Glass / Glassmorphism** para "e-commerce de lujo" | ❌ **Rechazado.** Blur animado, aberración cromática y traslucidez son lo contrario de *confianza silenciosa*, y la propia herramienta lo marca con rendimiento pobre y problemas de contraste |
| Paleta piedra + dorado (`#1C1917`, `#A16207`) | ❌ **Rechazado.** Desert Dune es decisión cerrada. Dato útil: la herramienta ajustó su propio acento dorado por no pasar contraste — el mismo problema que Ochre, resuelto en §2.1 |
| Patrón **"Minimal Single Column"** con un solo CTA | ❌ **No aplica.** Es un patrón de landing, no de tienda con catálogo y ficha |
| Radios de 8–16px, cuatro niveles de sombra, modales con `backdrop-filter` | ❌ **Rechazado.** La profundidad en NUDE se construye con color de fondo, no con elevación. Radio 2px, sin sombras |
| **Íconos Phosphor**, peso light | ✅ **Adoptado.** Su trazo fino es lo más cercano al isotipo. Resuelve el "íconos SVG de trazo" que estaba sin definir |
| Escala de espaciado espaciosa (4/8/24/32/48/64/96px) | ✅ **Adoptada tal cual** |
| Reglas de Next.js: `next/image`, Server Components por defecto, API de metadatos | ✅ **Adoptadas** — ver §9.5 |
| **GSAP** con ScrollTrigger para los reveals | ❌ **Rechazado.** Un fade de 12px no justifica ~50KB de librería. `IntersectionObserver` + CSS hace lo mismo |
| Advertencia: no ocultar por defecto contenido que el rastreador necesita | ✅ **Crítico, adoptado** — ver §9.5 |

**Resultado guardado en** `design-system/nude-sportswear-ecom/MASTER.md`, en la ruta que la propia herramienta usa para recuperarlo en sesiones futuras — pero con los tokens reales de NUDE, no los que generó. El archivo original proponía dorado `#A16207`, Montserrat y estilo Liquid Glass; dejarlo así habría creado una segunda fuente de verdad equivocada dentro del repositorio.

**Advertencia de diferenciación.** La combinación fondo crema + display serif + acento terracota es hoy la estética más repetida en diseño generado por IA. NUDE llegó ahí por su propia ruta — la identidad es de Croma Visual y está cerrada — pero significa que **el color y la tipografía no van a diferenciar a NUDE de nadie.** La diferenciación tiene que venir de la estructura, y por eso existe la sección siguiente.

---

## 11. Dirección de diseño — lo que hace este sitio distinto

Con paleta y tipografía cerradas, los ejes libres son **composición, estructura y movimiento**. Ahí se juega la personalidad.

### 11.1 El trazo continuo — elemento distintivo

El isotipo de NUDE es un **trazo caligráfico continuo**: la N y su punto se dibujan sin levantar la mano. Ese principio de construcción se convierte en el sistema estructural del sitio.

En vez de reglas horizontales sueltas separando secciones — que es lo que hace todo el mundo — el sitio tiene **una sola línea Ochre de 1px que desciende por la página**, se desplaza lateralmente en cada cambio de sección y vuelve a bajar. Una línea, no muchas. Al cargar la página se dibuja de arriba hacia abajo con `stroke-dashoffset`, en 1.2s, una sola vez.

```
        │                    La línea entra por el header
        │
   ─────┘                    y se desplaza donde empieza el manifiesto
   │
   │                         acompaña la columna de producto
   └────────┐
            │                y termina en el footer, bajo el isotipo
            ●
```

Por qué funciona para NUDE y no es decoración: nace de cómo está construido el isotipo, refuerza la idea de continuidad — *segunda piel*, algo que no se interrumpe — y es una sola línea de un píxel. Es lo más discreto que puede ser un elemento memorable, que es exactamente el tono de la marca.

En la ficha de producto la línea conecta la galería con el bloque de compra: la mirada la sigue de la foto al botón.

**Respeta `prefers-reduced-motion`:** con la preferencia activa la línea aparece dibujada, sin animación.

### 11.2 Composición asimétrica

La referencia centra todo — título, descripción, precios. Centrar es también el reflejo automático de cualquier plantilla.

NUDE usa un **eje izquierdo constante** con margen derecho generoso. Los títulos de sección, los textos y las etiquetas se alinean a ese eje; las imágenes de producto sangran al borde opuesto. Lee como editorial de moda impresa, no como catálogo.

```
DESKTOP — catálogo                    DESKTOP — manifiesto
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ │ LEGGINGS          ░░░░░░░░ │      │ │                            │
│ │ Tejido que se     ░░░░░░░░ │      │ │  Creemos que lo que        │
│ │ adapta.           ░░░░░░░░ │      │ │  llevas puesto debería     │
│ │                   ░░░░░░░░ │      │ │  sentirse tan bien         │
│ │ ┌────┐ ┌────┐ ┌────┐       │      │ │  como lo que eres.         │
│ │ │    │ │    │ │    │       │      │ │                            │
└──────────────────────────────┘      └──────────────────────────────┘
  ↑ eje                                 ↑ mismo eje, texto máx 640px
```

El centrado se reserva para dos momentos: el manifiesto y la confirmación de pedido. Al ser lo único centrado en todo el sitio, esos dos momentos pesan.

### 11.3 Movimiento

Poco y con intención. Confianza silenciosa también aplica a la animación.

| Momento | Comportamiento |
|---------|----------------|
| Carga inicial | La línea se dibuja, 1.2s. Una sola vez |
| Entrada de sección | Fade + 12px hacia arriba, 350ms, `power1.out` |
| Card de producto | Cruce a la segunda foto en 300ms. Sin zoom, sin sombra, sin levantar |
| Agregar al carrito | El panel entra desde la derecha en 300ms |
| Botón | Fondo Umber → Ochre y `translateY(-1px)` en 200ms |

Nada rebota, nada gira, nada hace parallax. Lo que se mueve, se mueve porque comunica algo.

---

## 12. Piso de calidad — verificar antes de cada entrega

Adoptado de `ui-ux-pro-max`, ordenado por severidad.

**Accesibilidad (crítico)**
- [ ] Contraste mínimo 4.5:1 en todo el texto — usar solo los tokens de §2.1
- [ ] Todo input con `<label>` asociado. **Nunca placeholder como etiqueta**
- [ ] Errores con `role="alert"`, debajo del campo, nunca solo un borde de color
- [ ] Foco visible por teclado en Ochre. No se elimina el `outline`
- [ ] Toda imagen de producto con `alt` descriptivo
- [ ] Botones de solo ícono con `aria-label`

**Interacción táctil (crítico)**
- [ ] Área mínima 44×44px, separación mínima 8px entre elementos tocables
- [ ] Ningún estado importante depende solo de `hover` — en móvil no existe
- [ ] Todo botón tiene estado de carga. Nada cambia en 0ms
- [ ] `cursor: pointer` en todo lo clicable

**Rendimiento**
- [ ] Imágenes en WebP, `lazy` salvo el hero
- [ ] Espacio reservado para imagen y contenido asíncrono — CLS bajo 0.1
- [ ] `font-display: swap` con fuente de respaldo métricamente parecida

**Formularios y checkout**
- [ ] Validación al salir del campo, no solo al enviar
- [ ] Al enviar: cargando → éxito o error. Nunca un clic sin respuesta
- [ ] Todo error dice cómo resolverse, no solo qué falló
- [ ] Teclado correcto en móvil: `inputmode="tel"` para celular, `type="email"` para correo

**Responsive y navegación**
- [ ] Probado a 375, 768, 1024 y 1440px
- [ ] Sin scroll horizontal. Sin zoom deshabilitado
- [ ] El header fijo no tapa el contenido de la primera sección
- [ ] `prefers-reduced-motion` respetado en todas las animaciones

**Disciplina visual**
- [ ] Íconos Phosphor peso light. **Ningún emoji como ícono**
- [ ] Ningún hex suelto en componentes — todo por token
- [ ] Sin sombras, sin `backdrop-filter`. Radio 2px en todo
- [ ] Separación por color de fondo y línea Ochre

**SEO (crítico en catálogo y ficha)**
- [ ] Catálogo y ficha renderizados en servidor, no en cliente
- [ ] Ningún contenido indexable oculto por defecto sin JS — verificar con JavaScript desactivado
- [ ] `metadata` exportado en cada ruta, con título y descripción propios por producto

---

## 13. Decisiones abiertas

1. **Tallaje** — confirmar con el proveedor si es XS–XL o talla única. La referencia usa talla única; tener tallas reales es ventaja competitiva directa y baja devoluciones. Bloquea el modelo de datos de variantes
2. **Ciudades del área metropolitana** — definir la lista inicial para la tarifa de $14.000
3. **Transportadora** — cotizar Coordinadora, Servientrega e Interrapidísimo, y verificar que $14.000 / $20.000 cubran el costo real
4. **Nombres de la primera colección y de cada referencia** — definir la nomenclatura
5. **Fotografía de producto** — el cuello de botella real. Sin fotos no hay tienda, sin importar cuánto código haya
6. **Cuenta bancaria** para transferencias y datos de facturación

---

## Anexos

- `assets/brand/` — isotipo y wordmark en SVG, listos para usar con `currentColor`
- `assets/reference/README.md` — desglose de las 22 capturas de camilaperezsport.com
- `../CLAUDE.md` — ADN de marca y decisiones cerradas
- `../branding/logos-oficiales/` — sistema de identidad de Croma Visual
- `../landing/landing-page/public/index.html` — tokens y componentes ya construidos
- `../landing/brand-sheet/public/index.html` — brand sheet oficial
- `../finanzas/app/src/firebase/auth.ts` — patrón de Google SSO con allowlist, se reutiliza en `/admin`
