import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'pdf-lib',
      '@pdf-lib/fontkit',
      'pdfjs-dist',
      'jszip',
      'file-saver',
      'clsx',
      'tailwind-merge',
    ],
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-engines': ['pdf-lib', '@pdf-lib/fontkit'],
          'pdfjs': ['pdfjs-dist'],
          'ocr-engine': ['tesseract.js'],
          'archive': ['jszip', 'file-saver'],
          'vendor-ui': ['react', 'react-dom', 'lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
