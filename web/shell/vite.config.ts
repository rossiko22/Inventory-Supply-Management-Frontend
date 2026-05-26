import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        authMf:        'http://localhost:3001/assets/remoteEntry.js',
        warehousesMf:  'http://localhost:3002/assets/remoteEntry.js',
        inventoryMf:   'http://localhost:3003/assets/remoteEntry.js',
        ordersMf:      'http://localhost:3004/assets/remoteEntry.js',
        companiesMf:   'http://localhost:3005/assets/remoteEntry.js',
        fleetMf:       'http://localhost:3006/assets/remoteEntry.js',
        productsMf:    'http://localhost:3007/assets/remoteEntry.js',
      },
      shared: {
        react:            { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom':      { singleton: true, requiredVersion: '^18.3.1' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.28.0' },
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      // Forward API calls to the Spring web gateway
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    minify: false,
  },
});
