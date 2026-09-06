import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Solo se prueban los modulos de `src/lib`: son las unicas piezas puramente
 * logicas del sitio (adaptador de producto, filtros, formato). Lo visual se
 * verifica con `npm run verificar` sobre un Chrome real, no con jsdom.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
