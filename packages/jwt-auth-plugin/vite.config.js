import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      name: 'JwtAuthPlugin',
      formats: ['es'],
      fileName: 'index',
    },
  },
})
