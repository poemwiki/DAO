import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// ESM friendly __dirname replacement
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // define: {
  //   global: {},
  //   'process.env': {}
  // },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.dao.com', 'localhost', '.poemwiki.org'],
  },

  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      supported: { bigint: true },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
