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
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code from app code so a game update
        // doesn't force players to re-download React/animation/socket
        // libraries they already have cached from the previous version.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-socket';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('livekit-client')) return 'vendor-livekit';
          return 'vendor';
        },
      },
    },
  },
});
