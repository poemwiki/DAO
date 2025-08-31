import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      '@': path.resolve(__dirname, './src'),
    },
  },
})
