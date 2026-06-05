import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5284', // Trỏ chính xác về port Backend .NET của bạn
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path // Giữ nguyên tiền tố /api để khớp với [Route("api/[controller]")] ở Backend
      }
    }
  },
});