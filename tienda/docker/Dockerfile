# syntax=docker/dockerfile:1
#
# Imagen de la tienda. La construye GitHub Actions (staging.yml y release.yml, con los
# flujos de shared-gha-stackless, solo si pasaron los checks) y la publica en GHCR;
# Coolify solo hace pull. Se construye desde tienda/:
#   docker build -f docker/Dockerfile -t tienda .
#
# Debian slim y no Alpine: sharp (procesa las fotos del panel) se resuelve contra glibc.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- builder: instala, construye Next y empaqueta los scripts de arranque ------------
FROM base AS builder
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# El build no tiene secretos ni base de datos. BETTER_AUTH_SECRET es un placeholder solo
# para esta linea (silencia el warning de "default secret" de Better Auth); nunca se usa
# en runtime ni queda como ENV de la imagen.
RUN SKIP_ENV_VALIDATION=1 BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime \
      npm run build
# En runtime no hay TypeScript ni tsx: el entrypoint (migrar → servir) y los dos scripts
# de operacion se empaquetan con sus dependencias (postgres, drizzle, aws-sdk).
RUN npx esbuild docker/entrypoint.ts src/db/seed.ts src/cli/medios-a-r2.ts \
      --bundle --platform=node --format=esm --target=node24 \
      --outdir=dist --entry-names=[name] --out-extension:.js=.mjs \
      --banner:js="import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"

# --- runner: solo lo que el standalone necesita --------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/dist/ ./
USER nextjs
EXPOSE 3000
CMD ["node", "entrypoint.mjs"]
