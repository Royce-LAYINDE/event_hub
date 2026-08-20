import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api/events': 'http://localhost:3001',
      '/api/participants': 'http://localhost:3002',
      '/api/registrations': 'http://localhost:3003',
    },
  },
});
