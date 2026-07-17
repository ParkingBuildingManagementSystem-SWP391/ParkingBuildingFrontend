import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7008,
    open: true,
    proxy: {
      '/api': {
        // https://localhost:7008
        target: 'https://mindy.huydevops.id.vn', // Trỏ chính xác về port Backend .NET của bạn
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path // Giữ nguyên tiền tố /api để khớp với [Route("api/[controller]")] ở Backend
      },
      '/hubs': {
        target: 'https://mindy.huydevops.id.vn',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
});