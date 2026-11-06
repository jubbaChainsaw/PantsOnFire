import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8787',
        ws: true,
      },
    },
  },
  /** `vite preview` has no dev proxy unless configured — e2e uses preview on 4173/4176. */
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8787',
        ws: true,
      },
    },
  },
});
