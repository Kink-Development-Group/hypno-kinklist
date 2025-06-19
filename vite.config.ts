import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  define: {
    // Monaco Editor global configuration to reduce CSP warnings
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
})
