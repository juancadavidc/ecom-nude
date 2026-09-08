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
