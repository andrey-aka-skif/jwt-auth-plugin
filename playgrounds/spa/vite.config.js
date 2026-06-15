import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@andrey-aka-skif/jwt-auth-plugin': fileURLToPath(
        new URL('../../packages/jwt-auth-plugin/src', import.meta.url)
      ),
    },
  },
})
