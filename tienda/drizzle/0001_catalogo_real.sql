-- allow-destructive: el catalogo real retira el inventario (variantes.stock) y pasa las categorias de enum a tabla; ningun ambiente tenia datos que conservar ahi.
CREATE TYPE "public"."estado_pedido" AS ENUM('nuevo', 'confirmado', 'pagado', 'enviado', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."metodo_pago" AS ENUM('transferencia', 'contraentrega');--> statement-breakpoint
ALTER TYPE "public"."estado_producto" ADD VALUE 'borrador';--> statement-breakpoint
ALTER TYPE "public"."talla" ADD VALUE 'U';--> statement-breakpoint
CREATE TABLE "categorias" (
	"slug" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" jsonb NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medios" (
	"id" text NOT NULL,
	"ancho" integer NOT NULL,
	"formato" text NOT NULL,
	"datos" "bytea" NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "medios_id_ancho_formato_pk" PRIMARY KEY("id","ancho","formato")
);
--> statement-breakpoint
CREATE TABLE "pedido_items" (
	"id" text PRIMARY KEY NOT NULL,
	"pedido_id" text NOT NULL,
	"sku" text NOT NULL,
	"producto_slug" text NOT NULL,
	"nombre" text NOT NULL,
	"color" text NOT NULL,
	"talla" text NOT NULL,
	"precio" integer NOT NULL,
	"cantidad" integer NOT NULL,
	"imagen" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" serial NOT NULL,
	"estado" "estado_pedido" DEFAULT 'nuevo' NOT NULL,
	"nombre" text NOT NULL,
	"celular" text NOT NULL,
	"correo" text NOT NULL,
	"departamento" text NOT NULL,
	"ciudad" text NOT NULL,
	"direccion" text NOT NULL,
	"barrio" text DEFAULT '' NOT NULL,
	"indicaciones" text DEFAULT '' NOT NULL,
	"metodo_pago" "metodo_pago" NOT NULL,
	"subtotal" integer NOT NULL,
	"envio" integer NOT NULL,
	"descuento" integer DEFAULT 0 NOT NULL,
	"codigo_descuento" text,
	"total" integer NOT NULL,
	"guia" text,
	"notas_internas" text DEFAULT '' NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
ALTER TABLE "productos" ALTER COLUMN "categoria" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "marca" text;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "destacado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "variantes" ADD COLUMN "disponible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "variantes" ADD COLUMN "precio" integer;--> statement-breakpoint
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pedido_items_pedido_id_idx" ON "pedido_items" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "pedidos_estado_creado_idx" ON "pedidos" USING btree ("estado","creado_en");--> statement-breakpoint
-- Las categorias tienen que existir antes de la FK: los productos que ya hay
-- usan leggings/tops/sets. ON CONFLICT para que la migracion sea idempotente
-- frente a una base que ya las tenga.
INSERT INTO "categorias" ("slug", "nombre", "intro", "orden") VALUES
	('enterizos', 'Enterizos', 'Una sola pieza que sujeta, estiliza y se mueve contigo. Tela fría, siso y espaldas abiertas.', 1),
	('sets', 'Sets', 'Piezas pensadas juntas: mismo tono, misma tela, misma caída.', 2),
	('leggings', 'Leggings', 'Tiro alto que se queda donde lo dejas y tela que no se transparenta.', 3),
	('tops', 'Tops y buzos', 'Sujeción sin apretar, capas ligeras y mangas que acompañan el entreno.', 4),
	('bodys', 'Bodys', 'Una segunda piel de cuello a cadera, para entrenar o para salir.', 5),
	('shorts-y-faldas', 'Shorts y faldas', 'Para los días de calor y los entrenos que piden piernas libres.', 6),
	('accesorios', 'Accesorios', 'Calentadoras y medias que terminan el look.', 7),
	('bienestar', 'Bienestar', 'Lo que te acompaña antes y después de moverte.', 8)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_categorias_slug_fk" FOREIGN KEY ("categoria") REFERENCES "public"."categorias"("slug") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
-- Sin inventario: lo que tenia unidades queda disponible, lo que no, agotado.
UPDATE "variantes" SET "disponible" = "stock" > 0;--> statement-breakpoint
ALTER TABLE "variantes" DROP COLUMN "stock";--> statement-breakpoint
DROP TYPE "public"."categoria";