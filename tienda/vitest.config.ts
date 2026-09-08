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
