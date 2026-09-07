# Postgres, Better Auth y entorno Docker — diseño

**Fecha:** 7 de septiembre de 2026
**Estado:** aprobado, listo para plan de implementación
**Reemplaza:** `SPEC.md` §9.1, §9.2 y §9.3 (stack, colecciones de Firestore, panel)
**Referencia de implementación:** `~/dev/personal/opensource/ecom-myspace` — ecommerce
hermano con este mismo stack, ya en producción

---

## 1. Qué se construye y por qué

La fase 2 del SPEC (modelo de datos y panel `/admin`) está bloqueada: no hay dónde
guardar un producto. Este trabajo levanta esa capa entera —base de datos, migraciones,
autenticación y entorno local reproducible— para que el panel se pueda construir encima
sin decisiones pendientes.

Al hacerlo se cambia una decisión mayor del SPEC: **Firebase sale, Postgres entra.**

### Por qué se cambia

`SPEC.md` §9.1 eligió Firestore con dos argumentos: "ya lo manejan" y "tiempo real gratis
para inventario". El primero dejó de ser cierto para este repo — el ecommerce hermano
`ecom-myspace` corre Postgres + Drizzle + Better Auth, desplegado por GHCR a Coolify, y
ese es hoy el stack que el equipo mantiene de verdad. El segundo compraba tiempo real
para una pantalla de inventario que todavía no existe.

A cambio se gana: un solo stack en los dos ecommerce, migraciones versionadas en git,
constraints reales sobre los datos, y cero dependencia de un proveedor.

### Autoridad

Este documento manda sobre `SPEC.md` §9 en todo lo que toque stack, datos y auth.
El resto del SPEC —identidad, tokens, arquitectura de información, modelo de producto
§6, microcopy, accesibilidad— sigue intacto y sigue mandando.

Actualizar `SPEC.md` §9 es parte de este trabajo, no un pendiente. El propio SPEC §10
establece el principio: dejar un documento diciendo lo contrario del código crea una
segunda fuente de verdad equivocada dentro del repositorio.

---

## 2. La restricción que fuerza el resto

`next.config.ts` tiene hoy `output: 'export'`. Eso no sobrevive a este trabajo, y no es
una preferencia. Del doc de Next 16 incluido en el repo:

| Fuente | Qué dice |
|---|---|
| `static-exports.md:294` | Usar Server Actions o `cookies()` con `next dev` **da error**, no solo en build |
| `static-exports.md:235` | En export, los Route Handlers **solo soportan `GET`** |

Better Auth necesita `POST` en `/api/auth/*` para el login y el callback de Google. El
panel necesita Server Actions y cookies de sesión. Las tres cosas son incompatibles con
el export estático.

**Consecuencia:** la app pasa a modo servidor, se empaqueta en un contenedor y se
despliega a Coolify. Firebase Hosting sale junto con el resto de Firebase.

Efecto secundario que resuelve un problema conocido: el README documenta que este repo y
el de la landing despliegan al mismo sitio de Firebase y "el último que corre
`firebase deploy` gana". Al mudarse este repo a Coolify, dejan de compartir destino y el
riesgo desaparece.

---

## 3. Entorno local

Un servicio en Compose. Next se queda corriendo en el host con `npm run dev`: en macOS el
bind mount de `node_modules` degrada el HMR de forma notoria, y la skill `run-tienda` ya
existente sigue sirviendo sin cambios.

```
tienda/
  docker-compose-local.yaml    solo la base de datos
  drizzle.config.ts
  drizzle/                     migraciones generadas, commiteadas
```

**Base de datos:** `postgres:17-alpine`, **pineado a propósito**. El hermano documentó
que el tag flotante `postgres:alpine` ya apunta a PG18, que espera el mount en
`/var/lib/postgresql` en vez de `/var/lib/postgresql/data` y no arranca con el volumen
(docker-library/postgres#1259). Ese hallazgo se copia, no se vuelve a pagar.

**Puerto 5434.** El 5432 y el 5433 están tomados por contenedores de otros proyectos en
esta máquina; el 5433 es la base de `ecom-myspace`.

Volumen nombrado para persistir entre reinicios, y healthcheck para que el arranque de la
app espere a que la base responda.

### Migraciones

Se generan con `drizzle-kit generate` a partir del esquema en TypeScript y **se commitean**.
Corren solas, sin paso manual que alguien pueda olvidar — que es la ergonomía del hermano
(`api/src/db/migrate.ts`, invocado desde `index.ts:26`).

El mecanismo **no se copia tal cual**: el hermano es Express y tiene un `index.ts` que se
ejecuta al arrancar. Next no tiene ese punto de entrada. Se usan dos hooks distintos, por
una razón concreta:

| Entorno | Mecanismo | Por qué |
|---|---|---|
| Local | `src/instrumentation.ts`, exportando `register()` | Es el hook oficial de Next para código de arranque: se llama una vez por instancia del servidor y **debe terminar antes de que el servidor acepte peticiones**. `npm run dev` migra solo |
| Contenedor | paso explícito en el entrypoint, antes de `next start` | Con más de una réplica, varios `register()` arrancarían la migración a la vez. En el entrypoint es un paso serializado y visible en los logs del deploy |

`register()` se ejecuta en todos los runtimes, así que el cuerpo va guardado con
`process.env.NEXT_RUNTIME === 'nodejs'`: el driver de Postgres no existe en el runtime
Edge y sin la guarda el arranque revienta.

---

## 4. Esquema

El tipo `Producto` de `src/lib/producto-modelo.ts` **no cambia**. Esa es la decisión que
hace que ningún componente se toque y que los 34 tests existentes sigan siendo el
contrato. Lo que cambia es de dónde se arma.

Se normaliza en tablas, a diferencia del hermano —que guarda `variants` e `images` como
JSONB— porque acá la integridad es el objetivo declarado del trabajo:

| Tabla | Contenido | Por qué así |
|---|---|---|
| `productos` | slug único, nombre, categoría, colección, precio, descripción, `detalles` como `text[]`, estado, tres campos de SEO, timestamps | Una fila por producto |
| `variantes` | FK a producto, color, hex, talla, **sku único**, stock | El inventario se edita por SKU en el panel; el único evita duplicados que en un JSONB entrarían sin chistar |
| `imagenes` | FK a producto, color, ruta, **orden** | `imagenes` es `Record<color, string[]>` y el orden importa: el commit `2ee1468` existe para que la primera foto nunca sea cream |
| `combina_con` | auto-referencia producto→producto con **orden** | "Completa el look" respeta la secuencia declarada |

**Enums de Postgres** para `categoria`, `talla` y `estado`. Las uniones cerradas de
TypeScript dejan de ser una convención y pasan a ser una restricción que la base hace
cumplir.

**Precios en `integer`.** El precio de NUDE es COP entero sin decimales. El hermano usa
`real` para plata (`schema.ts`, `salePrice`), que es coma flotante y acumula error de
redondeo; acá no se copia. Es además más simple.

---

## 5. El adaptador

`src/lib/productos.ts` conserva sus cuatro funciones y sus firmas exactas. Cambia el
cuerpo: consulta a Postgres vía Drizzle y rearma el tipo `Producto`. Es literalmente lo
que su propio comentario anticipa desde la fase 3 — "cambia el cuerpo de estas cuatro
funciones y ningún componente se toca".

Dos cambios internos que sí se notan:

**El cursor deja de ser un índice.** Hoy `cursor` es la posición en un array. Pasa a ser
un cursor de keyset sobre la consulta ordenada. El tipo ya lo previó: *"Opaco. Hoy es el
índice del siguiente elemento; en Firestore será otro."*

**Aparece validación en runtime.** El comentario de `productos.ts` advierte que hoy la
integridad la vigilan las pruebas porque el catálogo se empaqueta en build, y que al
mover los datos a runtime "esa migración tiene que traer un validador real, no solo
cambiar el fetch". Lo cubren dos capas: los constraints de la base (FK, unique, not null,
enums) y validación al leer, antes de devolver un `Producto`.

### Seed

`src/content/productos.json` —las 8 referencias del mock— se carga a la base con un
script de seed. Es el dato que existe; no se inventa catálogo nuevo. El JSON deja de ser
fuente de verdad y queda solo como semilla.

---

## 6. Autenticación

Better Auth (1.5.6, la versión que corre en el hermano), con el handler de Next en
`src/app/api/auth/[...all]/route.ts`. **No se agrega un servicio de API aparte:** el
hermano necesita Express porque su frontend es una SPA de Vite; NUDE es Next 16, donde
los Server Components y las Server Actions ya son el backend.

| Pieza | Configuración |
|---|---|
| Adaptador | `drizzleAdapter(db, { provider: 'pg' })` |
| Proveedor | `socialProviders.google` — Google SSO, como pedía SPEC §9.3 |
| Roles | plugin `admin()`, igual que el hermano |
| Autorización | allowlist de correos, aplicada al iniciar sesión |
| Esquema | `auth-schema.ts` entra al array `schema` de `drizzle.config.ts` |

El middleware `requireAdmin` del hermano (`api/src/middleware/auth.ts`), que rechaza
cuando `session.user.role !== 'admin'`, se adapta a la forma de Next: verificación en el
layout del grupo de rutas del panel.

La tienda pública **no tiene cuentas de clienta**. Auth existe solo para el panel, tal
como decía el SPEC.

---

## 7. Despliegue

`Dockerfile` para la app en modo servidor y workflow de GitHub Actions que construye y
publica a GHCR, copiado de `.github/workflows/docker-publish.yml` del hermano. Coolify
hace pull de la imagen; no construye.

Se borran del repo `firebase.json`, `.firebaserc` y toda referencia a `firebase deploy`.

**El sitio en vivo no se cae durante este trabajo:** sigue sirviendo el último build
estático ya publicado. Pero a partir de acá, desplegar significa Coolify, y el corte de
DNS es una tarea aparte.

---

## 8. Riesgos

**Dos implementaciones de la misma regla de filtrado.** `filtros.ts` filtra en JavaScript
y tiene 16 tests; es también el camino del cliente, que se queda porque el filtrado es
mejora progresiva. Al agregar filtrado en SQL, las dos pueden divergir en silencio.

*Mitigación:* un corpus de casos compartido que corre contra ambas rutas y afirma que
devuelven resultados idénticos. Si alguien cambia una y no la otra, falla una prueba con
nombre y línea.

**El panel escribe datos que el sitio público todavía no muestra distinto.** No es un
problema: es el orden que el SPEC §9.4 pide a propósito, para que Daniela cargue producto
mientras la tienda se construye.

**Credenciales de Google OAuth.** Client id y secret son secretos reales. Van en
`.env.local` (gitignoreado) y en las variables de entorno de Coolify, nunca en el repo.
`.env.example` documenta los nombres sin los valores.

---

## 9. Criterios de aceptación

1. `docker compose -f docker-compose-local.yaml up -d` levanta Postgres en 5434 y responde
   al healthcheck.
2. `npm run dev` sobre una base vacía corre las migraciones solo, antes de atender la
   primera petición, y sin paso manual.
3. El seed carga las 8 referencias de `productos.json` y la base las devuelve completas:
   variantes con su SKU, imágenes en orden, y el grafo de `combina_con`.
4. **30 de los 34 tests existentes pasan sin que se les toque una línea.** Los 4 del
   bloque `integridad del archivo de productos` son la excepción y se reescriben como
   pruebas de constraints: vigilaban un archivo que deja de ser fuente de verdad, y esa
   garantía pasa a vivir en la base.
5. Insertar una variante con SKU duplicado, una talla fuera del vocabulario o una imagen
   sin producto **falla en la base**, no en la aplicación.
6. El corpus compartido de filtrado da resultados idénticos por la ruta JS y por la SQL.
7. `npm run dev` arranca en modo servidor: Server Actions y `cookies()` funcionan.
8. Un correo de la allowlist entra por Google SSO y obtiene sesión con rol admin; uno
   fuera de la allowlist es rechazado.
9. `npm run lint` sale limpio y `npm test` pasa.
10. `SPEC.md` §9 refleja el stack real, y `tienda/README.md` no menciona Firestore ni
    `firebase deploy` como camino vigente.

---

## 10. Fuera de alcance

| Queda fuera | Por qué |
|---|---|
| Las pantallas de `/admin` (productos, inventario, pedidos, configuración, suscriptoras) | Es la pieza grande; merece su propio spec. Este trabajo le deja los cimientos |
| Storage de imágenes de producto (R2, como el hermano) | Se implementa junto a la pantalla que sube fotos |
| Carrito, checkout y creación de pedidos | Fase 4 del SPEC |
| El corte de DNS de nudesportswear.co a Coolify | Decisión de operación, con su propia ventana |
| Migrar `ecom-myspace` a precios `integer` | Mejora válida en el repo hermano, no en este |
