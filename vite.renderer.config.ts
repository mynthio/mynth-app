import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'src/mainview',
  plugins: [
    TanStackRouterVite({
      target: 'react',
      routesDirectory: path.resolve(__dirname, 'src/mainview/routes'),
      generatedRouteTree: path.resolve(__dirname, 'src/mainview/routeTree.gen.ts'),
      autoCodeSplitting: true,
      quoteStyle: 'double',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/mainview'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
