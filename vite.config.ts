import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    root: './',
    publicDir: 'dist',
    
    // Resolve path aliases für saubere Importe
    resolve: {
      extensions: ['.ts', '.js', '.json', '.scss'],
      alias: {
        '@': resolve(__dirname, './src'),
        '@styles': resolve(__dirname, './src/styles'),
        '@scripts': resolve(__dirname, './src/scripts')
      }
    },
    
    // Build Konfiguration
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      
      // Bessere Chunk-Strategie
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['jquery']
          }
        }
      }
    },
    
    // Entwicklungsserver
    server: {
      port: 9000,
      strictPort: true,
      open: true,
      cors: true
    },
    
    // CSS Vorverarbeitung
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables";`
        }
      },
      devSourcemap: true
    }
  };
});
