import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Google Apps Script Single-File Bundle Configuration
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist-gas',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // Inline all assets, fonts, svgs into HTML
    chunkSizeWarningLimit: 10000,
  },
});
