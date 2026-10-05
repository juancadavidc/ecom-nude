<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tienda NUDE — reglas duras

Sigue la arquitectura de referencia de `starter-next-auth` (un solo paquete npm en vez de
monorepo). Ver `README.md` → Despliegue.

- **Despliegue:** GitHub Actions → GHCR → Coolify. Los workflows de `../.github/workflows/`
  (`ci.yml`, `staging.yml`, `release.yml`) llaman a `juancadavidc/shared-gha-stackless@v1`.
  No agregues un workflow que publique imágenes saltándose checks y smoke. Coolify no
  construye imágenes.
- **`next build` nunca toca Postgres.** Toda página que lea la base es dinámica (el grupo
  `(tienda)` es `force-dynamic` desde su layout).
- **Migraciones solo aditivas.** Nunca edites ni borres un `.sql` de `drizzle/`: agrega uno
  nuevo con `npm run db:generate`. `DROP`/`RENAME`/cambio de tipo exige
  `-- allow-destructive: <motivo>` (`npm run check-migrations`).
- **Variables nuevas:** getter en `src/lib/env.ts` (o `src/lib/almacen/env.ts` si son de R2)
  + `.env.example` + `docker-compose.yaml`. Nada de leer `process.env` suelto.
- **Fotos de producto solo por `src/lib/almacen`** (R2 en producción, `.almacen/` en local).
  Nunca al disco del contenedor ni a Postgres. Las claves son inmutables: reemplazar una
  foto es subir otra con otra clave.
- **Cada Server Action del panel empieza con `exigirAdmin()`**; el layout de `/admin` protege
  páginas, no acciones. Los endpoints HTTP del plugin admin de Better Auth están apagados
  (`DISABLED_ADMIN_PATHS` en `src/lib/auth.ts`): no los reactives.

Comandos: `npm run dev` · `npm test` · `npm run typecheck` · `npm run lint` ·
`npm run db:up|db:migrate|db:generate|db:seed` · `npm run fotos:subir`
