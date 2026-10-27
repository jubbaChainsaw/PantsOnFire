import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const mobileBuild = process.env.POF_MOBILE_BUILD === '1';

export default defineConfig({
  base: mobileBuild ? './' : '/',
  define: {
    'import.meta.env.VITE_UI_RASTER_EXT': JSON.stringify(mobileBuild ? 'webp' : 'png'),
  },
  build: {
    sourcemap: false,
    reportCompressedSize: true,
    ...(mobileBuild
      ? {
          modulePreload: false,
        }
      : {}),
  },
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
});
