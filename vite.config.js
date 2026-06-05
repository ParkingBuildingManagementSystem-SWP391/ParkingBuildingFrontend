import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
<<<<<<< Updated upstream
    open: true, 
    proxy: {
      '/api': {
        target: 'https://localhost:7008', 
        changeOrigin: true,
        secure: false, 
=======
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5284',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path // keep /api intact
>>>>>>> Stashed changes
      }
    }
  },
});