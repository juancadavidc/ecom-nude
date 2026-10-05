import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Se prueban las piezas logicas del sitio, la capa de datos y los scripts de CI
 * (`scripts/*.test.ts`). Lo visual se verifica en el navegador, no con jsdom.
 *
 * `globalSetup` crea, migra y siembra `<base>_test` antes de correr cualquier
 * test — ver `vitest.global-setup.ts`. La base de desarrollo no se toca.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    globalSetup: './vitest.global-setup.ts',
    setupFiles: ['./vitest.setup.ts'],
    fileParallelism: false,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
