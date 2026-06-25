import { defineConfig } from '@hey-api/openapi-ts'

// Кодоген SDK из зафиксированного снапшота спеки. Чтобы обновить спеку —
// положите свежий swagger.json в src/shared/api/manifest/ и запустите `npm run generate`.
export default defineConfig({
  input: './src/shared/api/manifest/swagger.json',
  output: './src/shared/api/generated',
  plugins: ['@hey-api/client-axios'],
})
