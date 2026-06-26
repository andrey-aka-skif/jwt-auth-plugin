import { defineConfig } from '@hey-api/openapi-ts'

// Кодоген SDK из зафиксированного снапшота спеки. Чтобы обновить спеку —
// положите свежий swagger.json в src/shared/api/openApiManifest/ и запустите `npm run generate`.
export default defineConfig({
  input: './src/shared/api/openApiManifest/swagger.json',
  output: './src/shared/api/generated',
  plugins: ['@hey-api/client-axios'],
})
