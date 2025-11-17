import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // host: '127.0.0.1',
    // port: 3000
  },
  preview: {
    // Configure preview server to handle SPA routing
    port: 4173
  },
  build: {
    // Ensure proper handling of client-side routing
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
