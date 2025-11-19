import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true, // Auto-import Vuetify components and styles
    }),
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
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Separate vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('vuex')) {
              return 'vue-vendor'
            }
            if (id.includes('vuetify')) {
              return 'vuetify-vendor'
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor'
            }
            // Other node_modules
            return 'vendor'
          }
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  }
})
