# Postgres, Better Auth y entorno Docker — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el catálogo mock respaldado por `productos.json` con Postgres +
Drizzle, agregar autenticación de panel con Better Auth (Google SSO + allowlist), pasar
la app de export estático a modo servidor, y dejarla desplegable a Coolify vía
GHCR/GitHub Actions.

**Architecture:** Postgres 17 en un contenedor local (`docker-compose-local.yaml`),
esquema normalizado en tablas (`productos`, `variantes`, `imagenes`, `combina_con`) más
las tablas de Better Auth, todo definido con Drizzle ORM. El adaptador
`src/lib/productos.ts` conserva sus cuatro funciones y firmas; el cuerpo pasa de leer un
JSON a consultar Postgres, con validación en runtime como segunda capa sobre los
constraints de la base. Better Auth vive dentro de la misma app Next (Server Actions y
Route Handler, sin servicio de API aparte). La app pasa de `output: 'export'` a modo
servidor y se empaqueta en un `Dockerfile` que Coolify sólo hace `pull`.

**Tech Stack:** Next.js 16 (App Router, ya en el repo), Drizzle ORM 0.45 + Drizzle Kit
0.31, `postgres` 3.4 (driver), Better Auth 1.5.6, Postgres 17 (Docker), GitHub Actions →
GHCR → Coolify.

**Spec:**
`docs/superpowers/specs/2026-09-07-postgres-better-auth-docker.md`

**Referencia de implementación (patrones probados, no se copian literal):**
`~/dev/personal/opensource/ecom-myspace/api` — mismo stack de datos/auth, en producción.

## Global Constraints

- El tipo `Producto` de `src/lib/producto-modelo.ts` no cambia ni un campo.
- `src/lib/productos.ts` conserva sus cuatro firmas exactas:
  `listarProductos(opts?)`, `obtenerProducto(slug)`, `destacados(limite?)`,
  `combinaCon(slug)`. Ningún componente de `src/components` ni `src/app` se toca por
  esto.
- Postgres corre en `postgres:17-alpine` **pineado** (el tag flotante `alpine` ya
  apunta a PG18 y no arranca con un volumen en `/var/lib/postgresql/data` —
  docker-library/postgres#1259).
- Puerto local de Postgres: **5434** (5432 y 5433 están tomados por otros proyectos en
  esta máquina; 5433 es `ecom-myspace`).
- Precios en `integer` (COP sin decimales), nunca `real`/`float`.
- Better Auth fijo en **1.5.6** (la versión que corre en `ecom-myspace`).
- Ninguna credencial real (Google OAuth, `BETTER_AUTH_SECRET`) se comitea. Todo vive en
  `.env.local` (gitignorado, `tienda/.gitignore` ya cubre `.env*`) y `.env.example`
  documenta los nombres sin valores.
- `npm install` y todos los comandos de este plan se corren desde `tienda/`, no desde la
  raíz del repo (hay dos `package-lock.json`; ver `tienda/.claude/skills/run-tienda/SKILL.md`).
- Todas las rutas de archivo de este plan son relativas a `tienda/` salvo que digan
  "raíz del repo".

---

## Estructura de archivos

```
tienda/
  docker-compose-local.yaml       # NUEVO — solo Postgres
  drizzle.config.ts               # NUEVO
  drizzle/                        # NUEVO — migraciones generadas, se commitean
  Dockerfile                      # NUEVO
  .dockerignore                   # NUEVO
  entrypoint.sh                   # NUEVO — migración explícita + `next start`
  .env.example                    # NUEVO
  vitest.global-setup.ts          # NUEVO — migra + siembra antes de correr los tests
  next.config.ts                  # MODIFICADO — sin `output: 'export'`
  vitest.config.ts                # MODIFICADO — globalSetup + include de src/db
  package.json                    # MODIFICADO — deps + scripts db:*
  src/
    instrumentation.ts            # NUEVO — migración automática en `npm run dev`
    db/
      schema.ts                   # NUEVO — productos/variantes/imagenes/combina_con
      auth-schema.ts               # NUEVO — tablas de Better Auth
      index.ts                    # NUEVO — cliente Drizzle
      migrate.ts                  # NUEVO — runMigrations()
      run-migrate.ts              # NUEVO — CLI: corre runMigrations() y sale
      seed.ts                     # NUEVO — siembra productos.json en la base
      schema.test.ts              # NUEVO — constraints de la base
    lib/
      allowlist.ts                # NUEVO — parseo y chequeo de la allowlist
      allowlist.test.ts           # NUEVO
      auth.ts                     # NUEVO — instancia de Better Auth
      productos.ts                # MODIFICADO — cuerpo sobre Drizzle
      productos.test.ts           # MODIFICADO — 4 tests de integridad reescritos
      filtrado-corpus.test.ts     # NUEVO — corpus JS vs SQL
    app/
      api/auth/[...all]/route.ts  # NUEVO — handler de Better Auth
      admin/
        layout.tsx                # NUEVO — guardia de sesión + rol admin
        page.tsx                  # NUEVO — placeholder, prueba el guardia
      (tienda)/
        page.tsx                  # MODIFICADO — `export const dynamic = 'force-dynamic'`
        colecciones/page.tsx      # MODIFICADO — idem
        sistema/page.tsx          # MODIFICADO — idem
        [categoria]/page.tsx      # MODIFICADO — sin generateStaticParams, force-dynamic
        [categoria]/[slug]/page.tsx # MODIFICADO — idem
  firebase.json                   # BORRADO
  .firebaserc                     # BORRADO
  README.md                       # MODIFICADO — stack, despliegue, verificado
.github/workflows/docker-publish.yml  # NUEVO (raíz del repo)
SPEC.md                           # MODIFICADO — §9.1, §9.2, §9.3 (raíz del repo)
```

---

## Task 1: Dependencias, entorno y Postgres local

**Files:**
- Modify: `tienda/package.json`
- Create: `tienda/docker-compose-local.yaml`
- Create: `tienda/.env.example`

**Interfaces:**
- Produces: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_ALLOWLIST` — nombres de variable de
  entorno que toda tarea posterior asume ya definidos en `.env.local`.

- [ ] **Step 1: Agregar dependencias a `package.json`**

En `tienda/package.json`, agregar a `dependencies`:

```json
    "better-auth": "1.5.6",
    "dotenv": "^17.2.3",
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.8",
    "tsx": "^4.21.0",
```

Y a `devDependencies`:

```json
    "drizzle-kit": "^0.31.8",
```

`dotenv` y `tsx` van en `dependencies`, no en `devDependencies`: el paso de migración
del contenedor (Task 9) los corre en producción, y `npm ci --omit=dev` no instalaría
`devDependencies` ahí.

Agregar scripts, junto a los existentes:

```json
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/run-migrate.ts",
    "db:seed": "tsx src/db/seed.ts",
```

- [ ] **Step 2: Instalar**

```bash
cd tienda
npm install
```

- [ ] **Step 3: Crear `docker-compose-local.yaml`**

```yaml
services:
  db:
    # Pineado a proposito: el tag flotante 'postgres:alpine' ya apunta a PG18, que
    # espera el mount en /var/lib/postgresql (no en /var/lib/postgresql/data) y no
    # arranca con el volumen de abajo. Ver docker-library/postgres#1259.
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: nude
      POSTGRES_PASSWORD: nude
      POSTGRES_DB: nude_db
    ports:
      - '5434:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nude -d nude_db']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 4: Levantar y comprobar el healthcheck**

```bash
docker compose -f docker-compose-local.yaml up -d
docker compose -f docker-compose-local.yaml ps
```

Expected: el servicio `db` en estado `healthy` (puede tardar unos segundos; repetir
`ps` si sale `starting`).

- [ ] **Step 5: Crear `.env.example`**

```env
DATABASE_URL=postgres://nude:nude@localhost:5434/nude_db
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
# Registrar http://localhost:3000/api/auth/callback/google en Google Cloud Console
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Correos separados por coma. Cualquiera fuera de esta lista no puede crear sesion.
ADMIN_ALLOWLIST=correo@nudesportswear.co
```

- [ ] **Step 6: Crear `.env.local` (no se commitea, `.gitignore` ya cubre `.env*`)**

```bash
cp .env.example .env.local
```

Editar `.env.local` con `DATABASE_URL=postgres://nude:nude@localhost:5434/nude_db`,
un `BETTER_AUTH_SECRET` real (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
y, cuando estén disponibles, las credenciales de Google OAuth y la allowlist real.
Sin las credenciales de Google, las tareas de esquema/adaptador (2 a 7) funcionan
igual — sólo la Task 8 (Better Auth) las necesita para probarse manualmente.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json docker-compose-local.yaml .env.example
git commit -m "chore(tienda): dependencias y Postgres local para fase 2"
```

---

## Task 2: Esquema Drizzle y constraints de la base

**Files:**
- Create: `tienda/drizzle.config.ts`
- Create: `tienda/src/db/schema.ts`
- Create: `tienda/src/db/auth-schema.ts`
- Create: `tienda/src/db/index.ts`
- Create: `tienda/drizzle/` (migración generada)
- Test: `tienda/src/db/schema.test.ts`
- Modify: `tienda/vitest.config.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` (Task 1).
- Produces: `db` (cliente Drizzle, `src/db/index.ts`), tablas `productos`, `variantes`,
  `imagenes`, `combinaCon` y enums `categoriaEnum`, `tallaEnum`, `estadoProductoEnum`
  (`src/db/schema.ts`) — consumidos por el adaptador (Task 5) y el seed (Task 4).

- [ ] **Step 1: Crear `src/db/schema.ts`**

```ts
import { sql } from 'drizzle-orm'
import { check, index, integer, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

export const categoriaEnum = pgEnum('categoria', ['leggings', 'tops', 'sets'])
export const tallaEnum = pgEnum('talla', ['XS', 'S', 'M', 'L', 'XL'])
export const estadoProductoEnum = pgEnum('estado_producto', ['activo', 'agotado', 'proximamente'])

export const productos = pgTable('productos', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  categoria: categoriaEnum('categoria').notNull(),
  coleccion: text('coleccion').notNull(),
  precio: integer('precio').notNull(),
  descripcion: text('descripcion').notNull(),
  detalles: text('detalles').array().notNull(),
  estado: estadoProductoEnum('estado').notNull().default('activo'),
  seoTitulo: text('seo_titulo').notNull(),
  seoDescripcion: text('seo_descripcion').notNull(),
  seoAlt: text('seo_alt').notNull(),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
})

export const variantes = pgTable(
  'variantes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productoId: text('producto_id')
      .notNull()
      .references(() => productos.id, { onDelete: 'cascade' }),
    color: text('color').notNull(),
    hex: text('hex').notNull(),
    talla: tallaEnum('talla').notNull(),
    sku: text('sku').notNull().unique(),
    stock: integer('stock').notNull().default(0),
  },
  (t) => [index('variantes_producto_id_idx').on(t.productoId)],
)

export const imagenes = pgTable(
  'imagenes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productoId: text('producto_id')
      .notNull()
      .references(() => productos.id, { onDelete: 'cascade' }),
    color: text('color').notNull(),
    ruta: text('ruta').notNull(),
    orden: integer('orden').notNull(),
  },
  (t) => [index('imagenes_producto_id_color_idx').on(t.productoId, t.color, t.orden)],
)

export const combinaCon = pgTable(
  'combina_con',
  {
    productoId: text('producto_id')
      .notNull()
      .references(() => productos.id, { onDelete: 'cascade' }),
    combinaConId: text('combina_con_id')
      .notNull()
      .references(() => productos.id, { onDelete: 'cascade' }),
    orden: integer('orden').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productoId, t.combinaConId] }),
    check('combina_con_no_self', sql`${t.productoId} <> ${t.combinaConId}`),
    index('combina_con_producto_id_orden_idx').on(t.productoId, t.orden),
  ],
)
```

- [ ] **Step 2: Crear `src/db/auth-schema.ts`**

Tablas estándar de Better Auth + plugin `admin()` (mismo esquema que
`ecom-myspace/api/src/db/auth-schema.ts`, probado en producción):

```ts
import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (t) => [index('session_userId_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index('account_userId_idx').on(t.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))
```

- [ ] **Step 3: Crear `src/db/index.ts`**

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as authSchema from './auth-schema'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema: { ...schema, ...authSchema } })
```

- [ ] **Step 4: Crear `drizzle.config.ts`**

```ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 5: Generar y aplicar la migración**

```bash
npm run db:generate
```

Expected: crea `drizzle/0000_<algo>.sql` y `drizzle/meta/`. Revisar el SQL generado:
debe incluir los tres `CREATE TYPE` de los enums, las cuatro tablas de negocio, las
cuatro tablas de Better Auth, el `UNIQUE` en `variantes.sku` y `productos.slug`, y el
`CHECK` de `combina_con`.

Aplicarla contra la base local (necesita `DATABASE_URL` en el entorno — Next no está
corriendo todavía, así que se exporta a mano para este paso puntual):

```bash
set -a; source .env.local; set +a
npx drizzle-kit migrate
```

Expected: "Migrations applied" o equivalente, sin errores.

- [ ] **Step 6: Actualizar `vitest.config.ts` para incluir `src/db` y correr `globalSetup`**

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Solo se prueban los modulos de `src/lib` y `src/db`: son las piezas puramente
 * logicas del sitio mas la capa de datos. Lo visual se verifica con
 * `npm run verificar`, no con jsdom.
 *
 * `globalSetup` migra y siembra la base local antes de correr cualquier test — ver
 * `vitest.global-setup.ts`. Los tests asumen `docker compose -f
 * docker-compose-local.yaml up -d` ya corrido.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts', 'src/db/**/*.test.ts'],
    globalSetup: './vitest.global-setup.ts',
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

`vitest.global-setup.ts` se crea en la Task 4 (necesita `seed()`, que todavía no
existe). Este paso deja el `import` apuntando a un archivo que se crea después a
propósito — es el orden natural: el esquema primero, la siembra después.

- [ ] **Step 7: Escribir los tests de constraints (fallan hasta el Step 8, no hay `db` con datos)**

Crear `src/db/schema.test.ts`:

```ts
import { eq } from 'drizzle-orm'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { db } from './index'
import { combinaCon, imagenes, productos, variantes } from './schema'

async function crearProductoDePrueba(slug: string) {
  const [fila] = await db
    .insert(productos)
    .values({
      slug,
      nombre: 'Producto de prueba',
      categoria: 'leggings',
      coleccion: 'Prueba',
      precio: 100000,
      descripcion: 'x',
      detalles: [],
      seoTitulo: 'x',
      seoDescripcion: 'x',
      seoAlt: 'x',
    })
    .returning({ id: productos.id })
  return fila.id
}

describe('constraints de la base', () => {
  afterEach(async () => {
    await db.delete(productos).where(eq(productos.slug, 'constraint-test'))
    await db.delete(productos).where(eq(productos.slug, 'constraint-test-2'))
  })

  it('rechaza un SKU de variante duplicado', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await db.insert(variantes).values({ productoId: id, color: 'X', hex: '#000', talla: 'S', sku: 'DUP-SKU', stock: 1 })
    await expect(
      db.insert(variantes).values({ productoId: id, color: 'Y', hex: '#111', talla: 'M', sku: 'DUP-SKU', stock: 1 }),
    ).rejects.toThrow()
  })

  it('rechaza una talla fuera del vocabulario', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await expect(
      db.insert(variantes).values({
        productoId: id,
        color: 'X',
        hex: '#000',
        // @ts-expect-error — XXL no existe en el enum, es justo lo que se prueba
        talla: 'XXL',
        sku: 'TALLA-INVALIDA',
        stock: 1,
      }),
    ).rejects.toThrow()
  })

  it('rechaza una imagen sin producto', async () => {
    await expect(
      db.insert(imagenes).values({ productoId: 'no-existe', color: 'X', ruta: 'x', orden: 0 }),
    ).rejects.toThrow()
  })

  it('rechaza que un producto combine con si mismo', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await expect(db.insert(combinaCon).values({ productoId: id, combinaConId: id, orden: 0 })).rejects.toThrow()
  })

  it('rechaza combina_con hacia un producto que no existe', async () => {
    const id = await crearProductoDePrueba('constraint-test')
    await expect(
      db.insert(combinaCon).values({ productoId: id, combinaConId: 'no-existe', orden: 0 }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 8: Ejecutar temporalmente sin `globalSetup` para confirmar los constraints**

`globalSetup` todavía no existe (Task 4), así que por ahora se corre este archivo
solo, contra la base ya migrada en el Step 5:

```bash
set -a; source .env.local; set +a
npx vitest run src/db/schema.test.ts --no-coverage
```

Expected: los 5 tests pasan. Si alguno falla con "relation does not exist", revisar
que el Step 5 aplicó la migración correctamente.

- [ ] **Step 9: Commit**

```bash
git add drizzle.config.ts drizzle/ src/db/schema.ts src/db/auth-schema.ts src/db/index.ts \
  src/db/schema.test.ts vitest.config.ts
git commit -m "feat(tienda): esquema Drizzle y constraints de productos/variantes/imagenes"
```

---

## Task 3: Migraciones automáticas — `instrumentation.ts` y runner

**Files:**
- Create: `tienda/src/db/migrate.ts`
- Create: `tienda/src/db/run-migrate.ts`
- Create: `tienda/src/instrumentation.ts`

**Interfaces:**
- Consumes: `db` (`src/db/index.ts`, Task 2).
- Produces: `runMigrations()` (`src/db/migrate.ts`) — usado por `instrumentation.ts` y
  por `run-migrate.ts` (y luego por `vitest.global-setup.ts`, Task 4, y el
  `entrypoint.sh` del contenedor, Task 9).

- [ ] **Step 1: Crear `src/db/migrate.ts`**

```ts
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './index'

export async function runMigrations() {
  console.log('Corriendo migraciones...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migraciones completas.')
}
```

- [ ] **Step 2: Crear `src/db/run-migrate.ts` (CLI standalone, usado fuera de Next)**

```ts
import 'dotenv/config'
import { runMigrations } from './migrate'

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
```

- [ ] **Step 3: Probar el runner standalone**

```bash
npm run db:migrate
```

Expected: "Migraciones completas." — no debería aplicar nada nuevo (ya migrada en la
Task 2), pero confirma que el runner conecta y sale con código 0.

- [ ] **Step 4: Crear `src/instrumentation.ts`**

```ts
/**
 * Hook oficial de Next: se llama una vez por instancia del servidor y debe
 * terminar antes de que el servidor acepte peticiones.
 *
 * Solo migra en local (`npm run dev`, NODE_ENV=development). En el contenedor
 * NODE_ENV=production (ver Dockerfile) y la migracion corre como paso explicito
 * del entrypoint, antes de `next start` — con mas de una replica, varios
 * `register()` disparando la migracion a la vez no serian un paso serializado ni
 * quedarian en los logs del deploy como un solo evento.
 *
 * `register()` se ejecuta en todos los runtimes de Next; el driver de Postgres no
 * existe en el runtime Edge, de ahi la guarda de NEXT_RUNTIME.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'production') {
    const { runMigrations } = await import('./db/migrate')
    await runMigrations()
  }
}
```

- [ ] **Step 5: Verificación manual — migración automática en `npm run dev`**

```bash
docker compose -f docker-compose-local.yaml down -v   # base vacia de verdad
docker compose -f docker-compose-local.yaml up -d
npm run dev
```

Expected en el log de arranque: "Corriendo migraciones..." seguido de "Migraciones
completas." **antes** del mensaje de Next listo para servir peticiones. Parar el
server con Ctrl+C cuando se confirme.

- [ ] **Step 6: Commit**

```bash
git add src/db/migrate.ts src/db/run-migrate.ts src/instrumentation.ts
git commit -m "feat(tienda): migraciones automaticas en dev via instrumentation.ts"
```

---

## Task 4: Seed y arnés de pruebas contra Postgres

**Files:**
- Create: `tienda/src/db/seed.ts`
- Create: `tienda/vitest.global-setup.ts`

**Interfaces:**
- Consumes: `runMigrations()` (Task 3), `db` + tablas (Task 2), `src/content/productos.json`.
- Produces: `seed()` (`src/db/seed.ts`) — usado por `vitest.global-setup.ts` y por
  `npm run db:seed`.

- [ ] **Step 1: Crear `src/db/seed.ts`**

```ts
import 'dotenv/config'
import archivo from '../content/productos.json'
import type { Categoria, EstadoProducto, Talla } from '../lib/producto-modelo'
import { db } from './index'
import { combinaCon, imagenes, productos, variantes } from './schema'

type ProductoJson = {
  nombre: string
  slug: string
  categoria: Categoria
  coleccion: string
  precio: number
  descripcion: string
  detalles: string[]
  estado: EstadoProducto
  combina_con: string[]
  imagenes: Record<string, string[]>
  variantes: { color: string; hex: string; talla: Talla; sku: string; stock: number }[]
  seo: { titulo: string; descripcion: string; alt: string }
}

const catalogo = archivo.productos as ProductoJson[]

/**
 * Vacia y vuelve a llenar las cuatro tablas de negocio desde
 * `src/content/productos.json`. El JSON deja de ser fuente de verdad y queda solo
 * como semilla. Se corre en tres pasadas porque `combina_con` necesita que todos
 * los productos existan primero, y `creadoEn` recibe timestamps que preservan el
 * orden del archivo (asi el orden por defecto -- "novedad" -- sigue siendo el
 * orden del array, igual que en el mock).
 */
export async function seed() {
  await db.delete(combinaCon)
  await db.delete(imagenes)
  await db.delete(variantes)
  await db.delete(productos)

  const slugAId = new Map<string, string>()
  const base = Date.now()

  for (const [i, p] of catalogo.entries()) {
    const [fila] = await db
      .insert(productos)
      .values({
        slug: p.slug,
        nombre: p.nombre,
        categoria: p.categoria,
        coleccion: p.coleccion,
        precio: p.precio,
        descripcion: p.descripcion,
        detalles: p.detalles,
        estado: p.estado,
        seoTitulo: p.seo.titulo,
        seoDescripcion: p.seo.descripcion,
        seoAlt: p.seo.alt,
        creadoEn: new Date(base + i),
      })
      .returning({ id: productos.id })
    slugAId.set(p.slug, fila.id)
  }

  for (const p of catalogo) {
    const productoId = slugAId.get(p.slug)!

    if (p.variantes.length) {
      await db.insert(variantes).values(p.variantes.map((v) => ({ productoId, ...v })))
    }

    const filasImagenes = Object.entries(p.imagenes).flatMap(([color, rutas]) =>
      rutas.map((ruta, orden) => ({ productoId, color, ruta, orden })),
    )
    if (filasImagenes.length) await db.insert(imagenes).values(filasImagenes)
  }

  for (const p of catalogo) {
    const productoId = slugAId.get(p.slug)!
    const filas = p.combina_con.map((otro, orden) => ({
      productoId,
      combinaConId: slugAId.get(otro)!,
      orden,
    }))
    if (filas.length) await db.insert(combinaCon).values(filas)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log(`Seed OK: ${catalogo.length} productos.`)
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
```

- [ ] **Step 2: Correr el seed a mano y comprobar en la base**

```bash
npm run db:seed
```

Expected: "Seed OK: 8 productos."

Comprobar variantes, imágenes en orden y el grafo de `combina_con`:

```bash
set -a; source .env.local; set +a
psql "$DATABASE_URL" -c "select count(*) from productos;" \
  -c "select sku from variantes where sku = 'LEG-DUN-XS';" \
  -c "select color, ruta, orden from imagenes where producto_id = (select id from productos where slug = 'legging-duna') order by color, orden;" \
  -c "select p2.slug from combina_con cc join productos p1 on p1.id = cc.producto_id join productos p2 on p2.id = cc.combina_con_id where p1.slug = 'legging-duna' order by cc.orden;"
```

Expected: 8 productos, el SKU existe, las imágenes de "Duna" salen en el orden del
JSON (`producto-sahara`, `producto-dune`, `producto-cream`, `producto-white`), y
`combina_con` de `legging-duna` sale como `top-brisa, top-ocre, set-duna,
legging-cauce`.

- [ ] **Step 3: Crear `vitest.global-setup.ts`**

```ts
import 'dotenv/config'

/**
 * Corre una vez antes de toda la suite. Migra y vuelve a sembrar la base LOCAL de
 * `docker-compose-local.yaml` en cada corrida de `npm test` — es una base
 * descartable, así que borrar y resembrar en cada test run es intencional, no un
 * accidente: si tenías datos de prueba metidos a mano en el panel, `npm test` los
 * va a reemplazar por el seed de `productos.json`.
 */
export default async function setup() {
  const { runMigrations } = await import('./src/db/migrate')
  await runMigrations()
  const { seed } = await import('./src/db/seed')
  await seed()
}
```

- [ ] **Step 4: Correr el test de constraints de la Task 2 ya vía `vitest.config.ts`**

```bash
npm test -- src/db/schema.test.ts
```

Expected: los 5 tests pasan, y en el log de setup aparecen "Migraciones completas." y
"Seed OK: 8 productos." antes de los resultados.

- [ ] **Step 5: Commit**

```bash
git add src/db/seed.ts vitest.global-setup.ts
git commit -m "feat(tienda): seed de productos.json y arnes de tests contra Postgres"
```

---

## Task 5: Reescribir el adaptador `src/lib/productos.ts`

**Files:**
- Modify: `tienda/src/lib/productos.ts`
- Modify: `tienda/src/lib/productos.test.ts`

**Interfaces:**
- Consumes: `db`, `productos`, `variantes`, `imagenes`, `combinaCon` (Task 2);
  `aplicarFiltros` (`src/lib/filtros.ts`, sin cambios); `esCategoria`, `TALLAS`
  (`src/lib/producto-modelo.ts`, sin cambios).
- Produces: `listarProductos`, `obtenerProducto`, `destacados`, `combinaCon` — mismas
  firmas que hoy, consumidas sin cambios por `src/app/(tienda)/**` (Task 7) y por el
  corpus de filtrado (Task 6).

- [ ] **Step 1: Reescribir `src/lib/productos.ts`**

```ts
import { and, asc, desc, eq, exists, gt, gte, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { combinaCon as combinaConTabla, imagenes as imagenesTabla, productos as productosTabla, variantes as variantesTabla } from '@/db/schema'
import { aplicarFiltros } from './filtros'
import type { Categoria, Orden, Producto, Talla, Variante } from './producto-modelo'
import { TALLAS, esCategoria } from './producto-modelo'

/**
 * EL ADAPTADOR. Unico modulo del sitio que importa `@/db`.
 *
 * Las cuatro funciones conservan la firma de la fase 1: es literalmente lo que su
 * propio comentario anticipaba — "cambia el cuerpo de estas cuatro funciones y
 * ningun componente se toca". El cuerpo ahora consulta Postgres via Drizzle.
 *
 * Dos capas de integridad, como pedia el comentario original: los constraints de
 * la base (FK, unique, enums — ver src/db/schema.test.ts) y `validarProducto`, que
 * corre sobre cada fila antes de devolverla.
 */

type FilaProducto = typeof productosTabla.$inferSelect

type Cursor = { precio?: number; creadoEn: string }

function decodificarCursor(valor: string | undefined): Cursor | null {
  if (!valor) return null
  try {
    const datos = JSON.parse(Buffer.from(valor, 'base64url').toString('utf8'))
    if (typeof datos?.creadoEn !== 'string') return null
    return datos as Cursor
  } catch {
    // Un cursor que no se entiende es un cursor de otra version del sitio. Se
    // empieza por el principio en vez de devolver vacio.
    return null
  }
}

function codificarCursor(fila: FilaProducto): string {
  const cursor: Cursor = { precio: fila.precio, creadoEn: fila.creadoEn.toISOString() }
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

/**
 * `creadoEn` es siempre el desempate, sin importar el orden pedido: preserva el
 * orden del seed (= el orden del archivo) para dos productos del mismo precio,
 * igual que el `Array.sort` estable que usaba el mock.
 */
function condicionCursor(orden: Orden, cursor: Cursor | null): SQL | undefined {
  if (!cursor) return undefined
  const creadoEn = new Date(cursor.creadoEn)
  if (orden === 'precio-asc') {
    return or(
      gt(productosTabla.precio, cursor.precio!),
      and(eq(productosTabla.precio, cursor.precio!), gt(productosTabla.creadoEn, creadoEn)),
    )
  }
  if (orden === 'precio-desc') {
    return or(
      lt(productosTabla.precio, cursor.precio!),
      and(eq(productosTabla.precio, cursor.precio!), gt(productosTabla.creadoEn, creadoEn)),
    )
  }
  return gt(productosTabla.creadoEn, creadoEn)
}

/**
 * Color y talla se cruzan sobre la MISMA variante y solo cuentan si tiene stock —
 * igual regla que `pasaVariantes` en filtros.ts, aqui como EXISTS correlacionado.
 */
function condicionVariantes(colores: string[], tallas: Talla[]): SQL | undefined {
  if (!colores.length && !tallas.length) return undefined
  const condiciones = [
    eq(variantesTabla.productoId, productosTabla.id),
    sql`${variantesTabla.stock} > 0`,
    colores.length ? sql`${variantesTabla.color} = ANY(${colores})` : undefined,
    tallas.length ? sql`${variantesTabla.talla} = ANY(${tallas})` : undefined,
  ].filter((c): c is SQL => c != null)
  return exists(db.select().from(variantesTabla).where(and(...condiciones)))
}

function validarProducto(p: Producto): Producto {
  if (!esCategoria(p.categoria)) {
    throw new Error(`Producto ${p.slug}: categoria invalida "${p.categoria}"`)
  }
  for (const v of p.variantes) {
    if (!(TALLAS as readonly string[]).includes(v.talla)) {
      throw new Error(`Producto ${p.slug}: talla invalida "${v.talla}" en SKU ${v.sku}`)
    }
  }
  for (const color of Object.keys(p.imagenes)) {
    if (!p.variantes.some((v) => v.color === color)) {
      throw new Error(`Producto ${p.slug}: imagenes del color "${color}" sin variante correspondiente`)
    }
  }
  return p
}

async function combinaConDe(ids: string[]): Promise<Map<string, string[]>> {
  if (!ids.length) return new Map()
  const filas = await db
    .select({ productoId: combinaConTabla.productoId, slug: productosTabla.slug })
    .from(combinaConTabla)
    .innerJoin(productosTabla, eq(productosTabla.id, combinaConTabla.combinaConId))
    .where(sql`${combinaConTabla.productoId} = ANY(${ids})`)
    .orderBy(asc(combinaConTabla.orden))

  const mapa = new Map<string, string[]>()
  for (const fila of filas) {
    const lista = mapa.get(fila.productoId) ?? []
    lista.push(fila.slug)
    mapa.set(fila.productoId, lista)
  }
  return mapa
}

async function armarProductos(filas: FilaProducto[]): Promise<Producto[]> {
  if (!filas.length) return []
  const ids = filas.map((f) => f.id)

  const [variantesFilas, imagenesFilas, combinaConPorId] = await Promise.all([
    db.select().from(variantesTabla).where(sql`${variantesTabla.productoId} = ANY(${ids})`),
    db
      .select()
      .from(imagenesTabla)
      .where(sql`${imagenesTabla.productoId} = ANY(${ids})`)
      .orderBy(asc(imagenesTabla.orden)),
    combinaConDe(ids),
  ])

  return filas.map((fila) => {
    const variantes: Variante[] = variantesFilas
      .filter((v) => v.productoId === fila.id)
      .map((v) => ({ color: v.color, hex: v.hex, talla: v.talla, sku: v.sku, stock: v.stock }))

    const imagenes: Record<string, string[]> = {}
    for (const img of imagenesFilas.filter((i) => i.productoId === fila.id)) {
      ;(imagenes[img.color] ??= []).push(img.ruta)
    }

    return validarProducto({
      nombre: fila.nombre,
      slug: fila.slug,
      categoria: fila.categoria,
      coleccion: fila.coleccion,
      precio: fila.precio,
      descripcion: fila.descripcion,
      detalles: fila.detalles,
      variantes,
      imagenes,
      combina_con: combinaConPorId.get(fila.id) ?? [],
      estado: fila.estado,
      seo: { titulo: fila.seoTitulo, descripcion: fila.seoDescripcion, alt: fila.seoAlt },
    })
  })
}

export type OpcionesListado = {
  categoria?: Categoria
  colores?: string[]
  tallas?: Talla[]
  precio?: { min?: number; max?: number }
  orden?: Orden
  cursor?: string
  limite?: number
}

export async function listarProductos(
  opts: OpcionesListado = {},
): Promise<{ productos: Producto[]; siguiente: string | null }> {
  const { categoria, colores = [], tallas = [], precio = {}, orden = 'novedad', cursor, limite } = opts

  const condiciones = [
    categoria ? eq(productosTabla.categoria, categoria) : undefined,
    precio.min != null ? gte(productosTabla.precio, precio.min) : undefined,
    precio.max != null ? lte(productosTabla.precio, precio.max) : undefined,
    condicionVariantes(colores, tallas),
    condicionCursor(orden, decodificarCursor(cursor)),
  ].filter((c): c is SQL => c != null)

  const ordenColumnas =
    orden === 'precio-asc'
      ? [asc(productosTabla.precio), asc(productosTabla.creadoEn)]
      : orden === 'precio-desc'
        ? [desc(productosTabla.precio), asc(productosTabla.creadoEn)]
        : [asc(productosTabla.creadoEn)]

  const consulta = db
    .select()
    .from(productosTabla)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(...ordenColumnas)

  const filas = limite != null ? await consulta.limit(limite + 1) : await consulta
  const hayMas = limite != null && filas.length > limite
  const pagina = hayMas ? filas.slice(0, limite) : filas

  return {
    productos: await armarProductos(pagina),
    siguiente: hayMas ? codificarCursor(pagina[pagina.length - 1]) : null,
  }
}

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  const [fila] = await db.select().from(productosTabla).where(eq(productosTabla.slug, slug)).limit(1)
  if (!fila) return null
  const [producto] = await armarProductos([fila])
  return producto
}

/** SPEC §4.1 bloque 5 — cuatro en grilla. Nada agotado: no se destaca lo que no se puede vender. */
export async function destacados(limite = 4): Promise<Producto[]> {
  const { productos } = await listarProductos()
  const { estadoVisible } = await import('./producto-modelo')
  return productos.filter((p) => estadoVisible(p) !== 'agotado').slice(0, limite)
}

/** SPEC §4.3 — "Completa el look". Respeta el orden de `combina_con`. */
export async function combinaCon(slug: string): Promise<Producto[]> {
  const producto = await obtenerProducto(slug)
  if (!producto) return []
  const resultados = await Promise.all(producto.combina_con.map((otro) => obtenerProducto(otro)))
  return resultados.filter((p): p is Producto => Boolean(p))
}
```

`destacados` importa `estadoVisible` de forma dinámica en vez de en el tope del
archivo: `producto-modelo.ts` no depende de `productos.ts`, así que un `import`
normal aquí no crearía ciclo — pero se mantiene el `await import` solo para no tocar
el bloque de imports estáticos de arriba sin necesidad. Si al ejecutar lint esto se
marca como innecesario, subir `estadoVisible` al import estático del tope junto a
`esCategoria`/`TALLAS` es la corrección correcta.

- [ ] **Step 2: Reescribir el bloque de integridad en `src/lib/productos.test.ts`**

Los 4 tests de `describe('integridad del archivo de productos', ...)` vigilaban un
archivo que deja de ser fuente de verdad. Tres de esas reglas (slugs únicos,
categoría/talla del vocabulario, `combina_con` hacia algo que existe y no hacia sí
mismo) ya las prueba `src/db/schema.test.ts` como constraints reales. La cuarta
(color con imágenes ⇔ color con variantes) no es un constraint de la base — vive en
`validarProducto` — así que se reescribe como una prueba de esa validación:

Reemplazar en `src/lib/productos.test.ts`:

```ts
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
```

por:

```ts
describe('validacion al leer (segunda capa, sobre la base ya sembrada)', () => {
  it('todo color con imagenes tiene variantes y al reves', async () => {
    const { productos } = await listarProductos()
    for (const p of productos) {
      const enVariantes = new Set(p.variantes.map((v) => v.color))
      expect(new Set(Object.keys(p.imagenes))).toEqual(enVariantes)
    }
  })
})
```

Las otras tres reglas ya no se prueban aquí — su prueba es
`src/db/schema.test.ts`, que confirma que la base las hace cumplir de verdad (no
solo que los datos de hoy las cumplen). Quitar del `import` de arriba `CATEGORIAS` si
queda sin uso tras este cambio (revisar con el linter en el Step 4).

- [ ] **Step 3: Correr los tests del adaptador**

```bash
npm test -- src/lib/productos.test.ts
```

Expected: **30 tests pasan** (el describe reescrito cuenta como 1, más los otros 29
sin tocar) — el criterio de aceptación del spec es exactamente "30 de los 34
existentes pasan sin que se les toque una línea"; el test reescrito es 1 de los 4
que sí se tocan, y aquí queda reducido a 1 assertion en vez de 4 porque las otras 3
migraron a `schema.test.ts`.

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: limpio. Si `CATEGORIAS` quedó sin uso en `productos.test.ts`, quitarlo del
import.

- [ ] **Step 5: Commit**

```bash
git add src/lib/productos.ts src/lib/productos.test.ts
git commit -m "feat(tienda): adaptador de productos sobre Drizzle/Postgres"
```

---

## Task 6: Corpus compartido de filtrado (JS vs SQL)

**Files:**
- Create: `tienda/src/lib/filtrado-corpus.test.ts`

**Interfaces:**
- Consumes: `aplicarFiltros` (`src/lib/filtros.ts`), `listarProductos` (Task 5).

- [ ] **Step 1: Crear `src/lib/filtrado-corpus.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { aplicarFiltros, type FiltrosActivos } from './filtros'
import { listarProductos } from './productos'
import type { Talla } from './producto-modelo'

/**
 * Mitigacion del riesgo "dos implementaciones de la misma regla de filtrado"
 * (spec §8): la ruta JS (`aplicarFiltros`, mejora progresiva en el cliente) y la
 * ruta SQL (`listarProductos`, usada por el panel futuro) tienen que devolver el
 * mismo catalogo para los mismos filtros. Si alguien cambia una y no la otra, un
 * caso de este corpus falla con nombre y linea.
 */
const CASOS: { nombre: string; filtros: FiltrosActivos }[] = [
  { nombre: 'sin filtros', filtros: { colores: [], tallas: [], precio: {}, orden: 'novedad' } },
  { nombre: 'un color', filtros: { colores: ['Duna'], tallas: [], precio: {}, orden: 'novedad' } },
  { nombre: 'una talla, precio ascendente', filtros: { colores: [], tallas: ['XL' as Talla], precio: {}, orden: 'precio-asc' } },
  {
    nombre: 'color y talla cruzados, precio descendente',
    filtros: { colores: ['Arena'], tallas: ['S' as Talla], precio: {}, orden: 'precio-desc' },
  },
  { nombre: 'precio minimo', filtros: { colores: [], tallas: [], precio: { min: 100000 }, orden: 'novedad' } },
  { nombre: 'precio maximo, precio ascendente', filtros: { colores: [], tallas: [], precio: { max: 150000 }, orden: 'precio-asc' } },
  {
    nombre: 'colores, tallas y rango de precio combinados',
    filtros: {
      colores: ['Umbra', 'Duna'],
      tallas: ['M', 'L'] as Talla[],
      precio: { min: 90000, max: 230000 },
      orden: 'precio-desc',
    },
  },
]

describe('corpus compartido de filtrado: JS y SQL dan el mismo resultado', () => {
  it.each(CASOS.map((c) => [c.nombre, c.filtros] as const))('%s', async (_nombre, filtros) => {
    const { productos: catalogoCompleto } = await listarProductos()
    const esperado = aplicarFiltros(catalogoCompleto, filtros).map((p) => p.slug)

    const { productos: obtenidos } = await listarProductos({
      colores: filtros.colores,
      tallas: filtros.tallas,
      precio: filtros.precio,
      orden: filtros.orden,
    })

    expect(obtenidos.map((p) => p.slug)).toEqual(esperado)
  })
})
```

- [ ] **Step 2: Correr y confirmar**

```bash
npm test -- src/lib/filtrado-corpus.test.ts
```

Expected: los 7 casos pasan. Si alguno falla, el nombre del caso en el output dice
exactamente qué combinación de filtros diverge entre las dos rutas.

- [ ] **Step 3: Commit**

```bash
git add src/lib/filtrado-corpus.test.ts
git commit -m "test(tienda): corpus compartido JS vs SQL para el filtrado del catalogo"
```

---

## Task 7: Modo servidor — quitar el export estático

**Files:**
- Modify: `tienda/next.config.ts`
- Modify: `tienda/src/app/(tienda)/page.tsx`
- Modify: `tienda/src/app/(tienda)/colecciones/page.tsx`
- Modify: `tienda/src/app/(tienda)/sistema/page.tsx`
- Modify: `tienda/src/app/(tienda)/[categoria]/page.tsx`
- Modify: `tienda/src/app/(tienda)/[categoria]/[slug]/page.tsx`

**Interfaces:**
- Consumes: nada nuevo — este task cambia únicamente el modo de renderizado.

Nota de diseño (no está en el spec, pero es una consecuencia directa suya): con
`output: 'export'` fuera, Next intentaría **prerenderizar en build** cualquier ruta
que no declare lo contrario — y `npm run build` corre dentro del `Dockerfile` (Task
9), donde no hay Postgres disponible. Las cinco páginas que llaman al adaptador
tienen que declararse dinámicas explícitamente para no romper el build del
contenedor. El propio comentario que hoy vive en `next.config.ts` ya lo anticipaba:
"Catálogo y ficha de producto leen de Firestore y necesitan renderizado dinámico".

- [ ] **Step 1: Editar `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Next 16 bloquea por defecto los recursos de desarrollo pedidos desde un host
   * distinto a `localhost`. Sin esto, abrir el dev server por IP —desde el
   * celular en la misma red, que es como se revisa el movil de verdad— carga el
   * HTML pero mata el cliente de HMR y con el la hidratacion: la pagina se ve
   * pero nada responde. Se permiten loopback y rangos de red local privada.
   */
  allowedDevOrigins: ['127.0.0.1', '192.168.0.0/16', '10.0.0.0/8'],
}

export default nextConfig
```

- [ ] **Step 2: Quitar `generateStaticParams`/`dynamicParams` de `[categoria]/page.tsx`**

En `src/app/(tienda)/[categoria]/page.tsx`, reemplazar el bloque de comentario +
`dynamicParams`/`generateStaticParams` (líneas 7-22 actuales):

```ts
export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria }))
}
```

por:

```ts
/**
 * Catalogo por categoria: /leggings, /tops, /sets. Se renderiza en servidor en
 * cada peticion porque lee de Postgres — no hay `generateStaticParams` que
 * prerenderice esto en build, ya que el build del contenedor (Dockerfile) no
 * tiene la base disponible.
 */
export const dynamic = 'force-dynamic'
```

Quitar el import de `CATEGORIAS` si queda sin uso (revisar con lint en el Step 6).

- [ ] **Step 3: Quitar `generateStaticParams`/`dynamicParams` de `[categoria]/[slug]/page.tsx`**

Reemplazar (líneas 25-37 actuales):

```ts
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
```

por:

```ts
/**
 * Ficha de producto. La pagina mas importante del sitio: aqui se decide la
 * compra (SPEC §4.3). Renderizada en servidor en cada peticion — ver la nota de
 * `[categoria]/page.tsx` sobre por que no hay `generateStaticParams`.
 */
export const dynamic = 'force-dynamic'
```

- [ ] **Step 4: Marcar como dinámicas las otras tres páginas que leen del adaptador**

En `src/app/(tienda)/page.tsx`, `src/app/(tienda)/colecciones/page.tsx` y
`src/app/(tienda)/sistema/page.tsx`, agregar justo debajo de los imports:

```ts
export const dynamic = 'force-dynamic'
```

- [ ] **Step 5: Build de prueba con la base local arriba**

```bash
docker compose -f docker-compose-local.yaml up -d
npm run build
```

Expected: build exitoso, sin intentos de prerender de `/leggings`, `/tops`, `/sets`
ni de las fichas (el output de build no debe listar esas rutas como estáticas).

- [ ] **Step 6: Lint**

```bash
npm run lint
```

Expected: limpio.

- [ ] **Step 7: Verificación manual — Server Actions y cookies**

```bash
npm run dev
```

Abrir `http://localhost:3000/leggings/legging-duna` en el navegador: debe cargar
igual que antes (misma UI, ahora servida dinámicamente). Esto confirma el criterio
de aceptación 7 en su parte de renderizado; la parte de cookies de sesión se
confirma en la Task 8.

- [ ] **Step 8: Commit**

```bash
git add next.config.ts src/app/\(tienda\)/page.tsx src/app/\(tienda\)/colecciones/page.tsx \
  src/app/\(tienda\)/sistema/page.tsx "src/app/(tienda)/[categoria]/page.tsx" \
  "src/app/(tienda)/[categoria]/[slug]/page.tsx"
git commit -m "feat(tienda): modo servidor, sin output: export"
```

---

## Task 8: Better Auth — Google SSO, allowlist y guardia del panel

**Files:**
- Create: `tienda/src/lib/allowlist.ts`
- Create: `tienda/src/lib/allowlist.test.ts`
- Create: `tienda/src/lib/auth.ts`
- Create: `tienda/src/app/api/auth/[...all]/route.ts`
- Create: `tienda/src/app/admin/layout.tsx`
- Create: `tienda/src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `db` (Task 2), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_ALLOWLIST` (Task 1).
- Produces: `auth` (`src/lib/auth.ts`) — el panel de productos/inventario/pedidos
  (fuera de alcance de este plan) importa `auth.api.getSession` desde
  `src/app/admin/layout.tsx` en vez de reimplementar el guardia.

- [ ] **Step 1: Crear `src/lib/allowlist.ts`**

Pieza pura y separada de `auth.ts` a propósito: así se prueba sin inicializar
Better Auth completo (que necesita `GOOGLE_CLIENT_ID`/`SECRET` reales).

```ts
export function leerAllowlist(valor = process.env.ADMIN_ALLOWLIST ?? ''): string[] {
  return valor
    .split(',')
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean)
}

export function correoPermitido(correo: string, allowlist: string[]): boolean {
  return allowlist.includes(correo.trim().toLowerCase())
}
```

- [ ] **Step 2: Escribir el test (falla — el archivo del Step 1 ya existe, así que en
      realidad esto ya pasaría; confirmar de todas formas)**

Crear `src/lib/allowlist.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { correoPermitido, leerAllowlist } from './allowlist'

describe('leerAllowlist', () => {
  it('separa por coma, recorta espacios y pasa a minusculas', () => {
    expect(leerAllowlist('Daniela@Nude.co, juan@nude.co ,')).toEqual(['daniela@nude.co', 'juan@nude.co'])
  })

  it('una cadena vacia da una lista vacia', () => {
    expect(leerAllowlist('')).toEqual([])
  })
})

describe('correoPermitido', () => {
  it('acepta un correo de la allowlist sin importar mayusculas', () => {
    expect(correoPermitido('Daniela@NudeSportswear.co', ['daniela@nudesportswear.co'])).toBe(true)
  })

  it('rechaza un correo fuera de la allowlist', () => {
    expect(correoPermitido('otra@gmail.com', ['daniela@nudesportswear.co'])).toBe(false)
  })
})
```

- [ ] **Step 3: Correr y confirmar**

```bash
npm test -- src/lib/allowlist.test.ts
```

Expected: 4 tests pasan.

- [ ] **Step 4: Crear `src/lib/auth.ts`**

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'
import { db } from '@/db'
import { correoPermitido, leerAllowlist } from './allowlist'

const allowlist = leerAllowlist()

/**
 * Acceso con Google SSO y allowlist de correos (SPEC §9.3). La tienda publica no
 * tiene cuentas de clienta: esta instancia solo protege /admin.
 *
 * La allowlist se aplica en `databaseHooks.user.create.before`, que corre en el
 * primer inicio de sesion de cada correo (no hay email/password, asi que no hay
 * otra via de creacion de usuario). Devolver `false` aborta la creacion — Better
 * Auth responde con un error generico al cliente y no se crea sesion. Un correo
 * de la allowlist se promueve a `role: 'admin'` en el mismo hook: en esta app
 * cualquiera que pase el filtro ES la administradora, no hay un rol intermedio.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!correoPermitido(user.email, allowlist)) return false
          return { data: { ...user, role: 'admin' } }
        },
      },
    },
  },
  // `nextCookies()` tiene que ser el ultimo plugin — ver docs de Better Auth.
  plugins: [admin(), nextCookies()],
})
```

- [ ] **Step 5: Crear el route handler `src/app/api/auth/[...all]/route.ts`**

```ts
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 6: Crear el guardia `src/app/admin/layout.tsx`**

```tsx
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Equivalente al `requireAdmin` de Express del hermano, adaptado a la forma de
 * Next: verificacion en el layout del grupo de rutas del panel en vez de
 * middleware por ruta. Las pantallas de /admin (productos, inventario, pedidos,
 * configuracion, suscriptoras) quedan fuera de este plan — esto deja los cimientos
 * de acceso para que las construya su propio spec.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}
```

- [ ] **Step 7: Crear el placeholder `src/app/admin/page.tsx`**

```tsx
export default function AdminPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Panel</h1>
      <p>Las pantallas del panel tienen su propio spec. Esta ruta existe para
      confirmar que la sesion de administradora funciona.</p>
    </main>
  )
}
```

Esta página es deliberadamente ajena al design system (§1-§2 del SPEC): es un
andamiaje técnico para probar el guardia de sesión, no una pantalla de producto.

- [ ] **Step 8: Verificación manual — con credenciales de Google reales**

Requiere `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` reales en `.env.local` (Google
Cloud Console → credenciales OAuth, redirect URI
`http://localhost:3000/api/auth/callback/google`) y al menos un correo real en
`ADMIN_ALLOWLIST`.

```bash
npm run dev
```

1. Ir a `http://localhost:3000/admin` sin sesión → debe redirigir a `/`.
2. Provocar el flujo de Google (agregar un botón de login temporal o llamar
   `authClient.signIn.social({ provider: 'google' })` desde la consola del
   navegador si todavía no hay UI de login) con un correo de la allowlist → debe
   volver con sesión y, al visitar `/admin`, mostrar el placeholder.
3. Repetir con un correo fuera de la allowlist → el sign-in debe fallar (Better
   Auth devuelve un error; no se crea sesión ni usuario).

Esto no se automatiza en esta tarea: depende de una cuenta real de Google y no hay
todavía una pantalla de login en la UI (está fuera de alcance — la construye el
spec del panel). Registrar el resultado en la conversación de ejecución antes de
marcar el criterio de aceptación 8 como cumplido.

- [ ] **Step 9: Commit**

```bash
git add src/lib/allowlist.ts src/lib/allowlist.test.ts src/lib/auth.ts \
  "src/app/api/auth/[...all]/route.ts" src/app/admin/
git commit -m "feat(tienda): Better Auth con Google SSO, allowlist y guardia de /admin"
```

---

## Task 9: Dockerfile y migración en el entrypoint

**Files:**
- Create: `tienda/Dockerfile`
- Create: `tienda/.dockerignore`
- Create: `tienda/entrypoint.sh`

**Interfaces:**
- Consumes: `run-migrate.ts` (Task 3), build de Next (Task 7).

- [ ] **Step 1: Crear `.dockerignore`**

```
node_modules
.next
out
.git
.env
.env.local
.env.*.local
npm-debug.log*
```

- [ ] **Step 2: Crear `entrypoint.sh`**

```sh
#!/bin/sh
set -e

echo "Corriendo migraciones..."
./node_modules/.bin/tsx src/db/run-migrate.ts

echo "Arrancando Next en modo servidor..."
exec ./node_modules/.bin/next start
```

- [ ] **Step 3: Crear `Dockerfile`**

```dockerfile
# Node 22: la version verificada localmente (ver .claude/skills/run-tienda/SKILL.md).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY drizzle ./drizzle
COPY src/db ./src/db
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
```

- [ ] **Step 4: Build local de la imagen**

```bash
docker build -t nude-tienda:local .
```

Expected: build exitoso (usa el build de la Task 7, que ya no toca la base en
`npm run build`).

- [ ] **Step 5: Correr el contenedor contra la base de `docker-compose-local.yaml`**

La base de `docker-compose-local.yaml` no tiene una red de Docker propia (Task 1
la deja sin `networks:` porque hoy Next corre en el host); para probar el
contenedor completo, usar la red por defecto del compose y el nombre del servicio:

```bash
docker compose -f docker-compose-local.yaml up -d
docker run --rm -p 3000:3000 \
  --network tienda_default \
  -e DATABASE_URL=postgres://nude:nude@db:5432/nude_db \
  -e BETTER_AUTH_SECRET=dev-secret \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -e ADMIN_ALLOWLIST=correo@nudesportswear.co \
  nude-tienda:local
```

(El nombre de la red generado por compose sigue el patrón `<carpeta>_default`; si
`docker compose -f docker-compose-local.yaml ps` muestra otro nombre, usar ese.)

Expected en el log del contenedor: "Corriendo migraciones...", "Migraciones
completas.", luego Next anunciando que escucha en el puerto 3000.

```bash
curl -i http://localhost:3000/
```

Expected: `HTTP/1.1 200`.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore entrypoint.sh
git commit -m "feat(tienda): Dockerfile con migracion explicita en el entrypoint"
```

---

## Task 10: GitHub Actions — build y push a GHCR

**Files:**
- Create: `.github/workflows/docker-publish.yml` (raíz del repo, no `tienda/`)

**Interfaces:**
- Consumes: `tienda/Dockerfile` (Task 9).

- [ ] **Step 1: Crear el workflow**

```yaml
name: Build & Push Docker Image

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ghcr.io/juancadavidc/ecom-nude/tienda

jobs:
  build-tienda:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: ./tienda
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
```

- [ ] **Step 2: Validar la sintaxis YAML**

```bash
python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/docker-publish.yml'))" \
  && echo "YAML OK"
```

Expected: "YAML OK". (Este workflow solo se ejecuta de verdad en un push a `main`;
no hay forma de correrlo localmente sin `act`, así que esta validación de sintaxis
es lo que se puede confirmar en esta tarea.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/docker-publish.yml
git commit -m "ci: build y push de tienda a GHCR en cada push a main"
```

---

## Task 11: Borrar Firebase, actualizar README y SPEC.md §9

**Files:**
- Delete: `tienda/firebase.json`
- Delete: `tienda/.firebaserc`
- Modify: `tienda/README.md`
- Modify: `SPEC.md` (raíz del repo, §9.1, §9.2, §9.3)

**Interfaces:** ninguna — este task es documentación y limpieza.

- [ ] **Step 1: Borrar los archivos de Firebase**

```bash
git rm tienda/firebase.json tienda/.firebaserc
```

- [ ] **Step 2: Actualizar `SPEC.md` §9.1 — tabla de stack**

Reemplazar la tabla de §9.1 (Firestore/Firebase Storage/Firebase Auth/Cloud
Functions/Firebase Hosting) por:

```markdown
| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | **Next.js (App Router) + TypeScript** | Renderizado en servidor para SEO real en catálogo y fichas |
| Estilos | **Tailwind** con los tokens de §2 como variables CSS | Mismo stack que la app de finanzas |
| Datos | **Postgres 17 + Drizzle ORM** | Mismo stack que `ecom-myspace`, el ecommerce hermano ya en producción. Migraciones versionadas en git, constraints reales sobre los datos |
| Imágenes | Por definir junto a la pantalla que sube fotos (fuera de alcance de la fase de datos) | Ver `docs/superpowers/specs/2026-09-07-postgres-better-auth-docker.md` §10 |
| Auth | **Better Auth** — Google SSO + allowlist de correos, solo para el panel | La tienda no tiene cuentas de clienta |
| Lógica de servidor | **Server Actions de Next** | Sin servicio de API aparte: los Server Components ya son el backend |
| Correos | Por definir (fase 5) | — |
| Hosting | **Coolify**, imagen Docker publicada a GHCR por GitHub Actions | Mismo flujo que `ecom-myspace` |

> Detalle de esta decisión y su justificación:
> `docs/superpowers/specs/2026-09-07-postgres-better-auth-docker.md`.
```

- [ ] **Step 3: Actualizar `SPEC.md` §9.2**

Reemplazar el bloque de colecciones de Firestore por:

```markdown
### 9.2 Esquema de Postgres

```
productos            slug, nombre, categoria, coleccion, precio, descripcion,
                      detalles[], estado, seo, timestamps
variantes             FK a producto, color, hex, talla, sku (unico), stock
imagenes              FK a producto, color, ruta, orden
combina_con           auto-referencia producto→producto, con orden
```

Esquema completo, con el porqué de cada columna:
`docs/superpowers/specs/2026-09-07-postgres-better-auth-docker.md` §4.

`pedidos`, `config` y `suscriptores` (fase 4+) todavía no existen — se diseñan con
su propio spec cuando llegue esa fase.
```

- [ ] **Step 4: Actualizar `SPEC.md` §9.3 — línea de acceso**

Reemplazar la línea "Acceso con Google SSO y allowlist de correos, exactamente el
mismo patrón que ya funciona en `finanzas/app`. Se reutiliza el código de
autenticación." por:

```markdown
Acceso con Google SSO y allowlist de correos (`ADMIN_ALLOWLIST`), vía Better Auth —
ver `docs/superpowers/specs/2026-09-07-postgres-better-auth-docker.md` §6. El
guardia de sesión ya existe en `tienda/src/app/admin/layout.tsx`; las pantallas de
esta tabla las construye su propio spec sobre esos cimientos.
```

- [ ] **Step 5: Actualizar `tienda/README.md`**

Cambiar la primera línea de:

```markdown
Next.js 16 (App Router) + TypeScript + Tailwind 4 + Firestore.
```

a:

```markdown
Next.js 16 (App Router) + TypeScript + Tailwind 4 + Postgres (Drizzle) + Better Auth.
```

Reemplazar todo el bloque **"## Despliegue"** (Firebase Hosting, el riesgo
compartido con la landing, el rollback) por:

```markdown
## Despliegue

**Ya no es export estático.** La app corre en modo servidor (Server Actions,
cookies de sesión, `POST` en `/api/auth/*`) — ver
`docs/superpowers/specs/2026-09-07-postgres-better-auth-docker.md` §2.

```bash
docker compose -f docker-compose-local.yaml up -d   # Postgres local, puerto 5434
npm run dev                                          # migra solo, sirve en :3000
```

**Producción:** GitHub Actions construye la imagen en cada push a `main` y la
publica en `ghcr.io/juancadavidc/ecom-nude/tienda`. Coolify hace `pull` de esa
imagen — no construye nada. El corte de DNS de `nudesportswear.co` hacia Coolify es
una tarea aparte, todavía no hecha: el sitio en vivo sigue siendo el último build
estático publicado en Firebase hasta que ese corte ocurra.

**Migraciones:** automáticas en `npm run dev` (`src/instrumentation.ts`) y como
paso explícito del `entrypoint.sh` del contenedor, antes de `next start`. Nunca a
mano.
```

Quitar del README las menciones a `firebase deploy`, `firebase hosting:channel:deploy`
y a la landing compartiendo sitio de Firebase — ese riesgo desaparece con este
trabajo (spec §2).

En la sección **"## Verificado"**, agregar una nota:

```markdown
**`npm run verificar` queda temporalmente sin vigencia.** Corría Playwright contra
`out/`, el export estático que este trabajo elimina. Adaptarlo para correr contra
`next start` (o borrarlo) es un pendiente aparte — no está en el alcance de este
plan. Mientras tanto, la verificación visual pasa por `run-tienda`
(`.claude/skills/run-tienda/`) contra el dev server.
```

- [ ] **Step 6: Commit**

```bash
git add -u tienda/firebase.json tienda/.firebaserc
git add tienda/README.md SPEC.md
git commit -m "docs: SPEC.md §9 y README reflejan Postgres/Better Auth/Coolify, sin Firebase"
```

---

## Task 12: Verificación final

**Files:** ninguno nuevo — solo corridas de verificación.

- [ ] **Step 1: Lint completo**

```bash
cd tienda && npm run lint
```

Expected: limpio (criterio de aceptación 9).

- [ ] **Step 2: Suite completa de tests, con la base local arriba**

```bash
docker compose -f docker-compose-local.yaml up -d
npm test
```

Expected: todos los tests pasan — incluye `producto-modelo` (sin tocar),
`filtros.test.ts` (sin tocar), `productos.test.ts` (30 sin tocar + 1 reescrito),
`filtrado-corpus.test.ts` (7 casos), `allowlist.test.ts` (4), `schema.test.ts` (5).

- [ ] **Step 3: Build de producción**

```bash
npm run build
```

Expected: build exitoso, sin rutas de catálogo/ficha prerenderizadas estáticamente
(confirmado ya en la Task 7, se repite aquí como parte de la verificación final).

- [ ] **Step 4: Migración desde cero, de punta a punta**

```bash
docker compose -f docker-compose-local.yaml down -v
docker compose -f docker-compose-local.yaml up -d
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/colecciones
kill %1
```

Expected: `200`. Esto confirma que una base completamente vacía llega a servir la
primera petición sin ningún paso manual (criterio de aceptación 2).

- [ ] **Step 5: Confirmar el seed completo**

```bash
npm run db:seed
```

Expected: "Seed OK: 8 productos." (criterio de aceptación 3, ya probado a fondo en
la Task 4 — esta corrida final confirma que sigue funcionando después de todos los
cambios posteriores).

- [ ] **Step 6: Revisar que no quede texto de Firestore/`firebase deploy` vigente**

```bash
grep -rn "Firestore\|firebase deploy" tienda/README.md SPEC.md
```

Expected: sin resultados (o solo referencias históricas claramente marcadas como
tales, si alguna quedó a propósito).

- [ ] **Step 7: Commit final si algo quedó pendiente de un paso anterior**

Si los Steps 1-6 no requirieron cambios de código, no hay nada que commitear aquí —
este task es de verificación. Si algo falló y se corrigió, commitear con un mensaje
que describa la corrección puntual (no "fix" genérico).

---

## Seguimiento fuera de este plan

- **Adaptar o retirar `scripts/verificar.mjs`** — asumía `out/` estático; documentado
  como pendiente en el README (Task 11), no resuelto aquí.
- **Pantallas de `/admin`** (productos, inventario, pedidos, configuración,
  suscriptoras) — su propio spec, sobre los cimientos de auth de la Task 8.
- **UI de login** — hoy no existe ningún botón que dispare
  `authClient.signIn.social({ provider: 'google' })`; llega con las pantallas del
  panel.
- **Storage de imágenes de producto, carrito/checkout, corte de DNS** — spec §10,
  fuera de alcance explícito.
