CREATE TYPE "public"."categoria" AS ENUM('leggings', 'tops', 'sets');--> statement-breakpoint
CREATE TYPE "public"."estado_producto" AS ENUM('activo', 'agotado', 'proximamente');--> statement-breakpoint
CREATE TYPE "public"."talla" AS ENUM('XS', 'S', 'M', 'L', 'XL');--> statement-breakpoint
CREATE TABLE "combina_con" (
	"producto_id" text NOT NULL,
	"combina_con_id" text NOT NULL,
	"orden" integer NOT NULL,
	CONSTRAINT "combina_con_producto_id_combina_con_id_pk" PRIMARY KEY("producto_id","combina_con_id"),
	CONSTRAINT "combina_con_no_self" CHECK ("combina_con"."producto_id" <> "combina_con"."combina_con_id")
);
--> statement-breakpoint
CREATE TABLE "imagenes" (
	"id" text PRIMARY KEY NOT NULL,
	"producto_id" text NOT NULL,
	"color" text NOT NULL,
	"ruta" text NOT NULL,
	"orden" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"categoria" "categoria" NOT NULL,
	"coleccion" text NOT NULL,
	"precio" integer NOT NULL,
	"descripcion" text NOT NULL,
	"detalles" text[] NOT NULL,
	"estado" "estado_producto" DEFAULT 'activo' NOT NULL,
	"seo_titulo" text NOT NULL,
	"seo_descripcion" text NOT NULL,
	"seo_alt" text NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "productos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "variantes" (
	"id" text PRIMARY KEY NOT NULL,
	"producto_id" text NOT NULL,
	"color" text NOT NULL,
	"hex" text NOT NULL,
	"talla" "talla" NOT NULL,
	"sku" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "variantes_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "combina_con" ADD CONSTRAINT "combina_con_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combina_con" ADD CONSTRAINT "combina_con_combina_con_id_productos_id_fk" FOREIGN KEY ("combina_con_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagenes" ADD CONSTRAINT "imagenes_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "combina_con_producto_id_orden_idx" ON "combina_con" USING btree ("producto_id","orden");--> statement-breakpoint
CREATE INDEX "imagenes_producto_id_color_idx" ON "imagenes" USING btree ("producto_id","color","orden");--> statement-breakpoint
CREATE INDEX "variantes_producto_id_idx" ON "variantes" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");