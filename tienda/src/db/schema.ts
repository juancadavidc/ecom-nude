import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * `U` es talla unica: calentadoras, medias, manguitas y todo lo que no se mide
 * en XS–XL. Va en el mismo enum para que una variante siempre tenga talla.
 */
export const tallaEnum = pgEnum('talla', ['XS', 'S', 'M', 'L', 'XL', 'U'])

/**
 * `borrador` existe porque la carga de producto la hace una persona, por partes:
 * un producto sin fotos no se publica, pero tiene que poder existir en el panel.
 */
export const estadoProductoEnum = pgEnum('estado_producto', ['activo', 'agotado', 'proximamente', 'borrador'])

/**
 * Las categorias viven en una tabla y no en un enum: la tienda vende enterizos,
 * bodys, faldas y accesorios que el modelo original (leggings/tops/sets) no
 * contemplaba, y agregar una categoria no puede requerir una migracion.
 */
export const categorias = pgTable('categorias', {
  slug: text('slug').primaryKey(),
  nombre: text('nombre').notNull(),
  /** Dos lineas de encabezado del catalogo (SPEC §4.2). */
  intro: text('intro').notNull().default(''),
  orden: integer('orden').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
})

export const productos = pgTable('productos', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  categoria: text('categoria')
    .notNull()
    .references(() => categorias.slug, { onUpdate: 'cascade' }),
  coleccion: text('coleccion').notNull(),
  /** Proveedor o linea de origen. Dato interno del panel: nunca se pinta en la tienda. */
  marca: text('marca'),
  /** Precio base en COP. Un color puede sobreescribirlo (`variantes.precio`). */
  precio: integer('precio').notNull(),
  descripcion: text('descripcion').notNull(),
  detalles: text('detalles').array().notNull(),
  estado: estadoProductoEnum('estado').notNull().default('activo'),
  destacado: boolean('destacado').notNull().default(false),
  seoTitulo: text('seo_titulo').notNull(),
  seoDescripcion: text('seo_descripcion').notNull(),
  seoAlt: text('seo_alt').notNull(),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
})

/**
 * No se maneja inventario: una variante esta disponible o no, y eso lo decide
 * la persona en el panel. `precio` es null cuando el color cuesta lo mismo que
 * el producto.
 */
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
    disponible: boolean('disponible').notNull().default(true),
    precio: integer('precio'),
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
    /** Nombre base en `public/fotos` ("p/legging-rib-1") o ruta de medio subido ("/media/<id>"). */
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

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
})

/**
 * LEGADO: aqui guardaba el panel las fotos subidas antes de pasar a R2 (ver
 * `src/lib/admin/medios.ts`). Ya nadie escribe ni lee esta tabla; queda solo
 * para que `npm run medios:a-r2` copie lo que haya al almacen. Se retira con
 * una migracion `-- allow-destructive` cuando todos los ambientes la hayan
 * copiado.
 */
export const medios = pgTable(
  'medios',
  {
    id: text('id').notNull(),
    ancho: integer('ancho').notNull(),
    formato: text('formato').notNull(),
    datos: bytea('datos').notNull(),
    creadoEn: timestamp('creado_en').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.id, t.ancho, t.formato] })],
)

export const estadoPedidoEnum = pgEnum('estado_pedido', [
  'nuevo',
  'confirmado',
  'pagado',
  'enviado',
  'entregado',
  'cancelado',
])

export const metodoPagoEnum = pgEnum('metodo_pago', ['transferencia', 'contraentrega'])

export const pedidos = pgTable(
  'pedidos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Numero corto que ve la clienta y se escribe por WhatsApp. */
    numero: serial('numero').notNull().unique(),
    estado: estadoPedidoEnum('estado').notNull().default('nuevo'),
    nombre: text('nombre').notNull(),
    celular: text('celular').notNull(),
    correo: text('correo').notNull(),
    departamento: text('departamento').notNull(),
    ciudad: text('ciudad').notNull(),
    direccion: text('direccion').notNull(),
    barrio: text('barrio').notNull().default(''),
    indicaciones: text('indicaciones').notNull().default(''),
    metodoPago: metodoPagoEnum('metodo_pago').notNull(),
    subtotal: integer('subtotal').notNull(),
    envio: integer('envio').notNull(),
    descuento: integer('descuento').notNull().default(0),
    codigoDescuento: text('codigo_descuento'),
    total: integer('total').notNull(),
    guia: text('guia'),
    notasInternas: text('notas_internas').notNull().default(''),
    creadoEn: timestamp('creado_en').defaultNow().notNull(),
    actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
  },
  (t) => [index('pedidos_estado_creado_idx').on(t.estado, t.creadoEn)],
)

/** Copia de lo comprado al momento de comprar: si el producto cambia despues, el pedido no. */
export const pedidoItems = pgTable(
  'pedido_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pedidoId: text('pedido_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    productoSlug: text('producto_slug').notNull(),
    nombre: text('nombre').notNull(),
    color: text('color').notNull(),
    talla: text('talla').notNull(),
    precio: integer('precio').notNull(),
    cantidad: integer('cantidad').notNull(),
    imagen: text('imagen').notNull().default(''),
  },
  (t) => [index('pedido_items_pedido_id_idx').on(t.pedidoId)],
)

/**
 * Parametros que la operacion cambia sin desplegar (SPEC §4.5 y §9.3): tarifas
 * de envio, ciudades del area metropolitana, datos bancarios, WhatsApp, codigos
 * de descuento. Una fila por clave, valor JSON — ver `src/lib/config.ts`.
 */
export const config = pgTable('config', {
  clave: text('clave').primaryKey(),
  valor: jsonb('valor').notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
})
