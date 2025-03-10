import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'public',
    emptyOutDir: false
  },
  server: {
    port: 9000
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
});
