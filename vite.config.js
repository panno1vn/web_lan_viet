import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Header bảo mật cho dev server. CSP đầy đủ do API ASP.NET Core đặt (backend/LanViet.Api/Security/SecurityMiddleware.cs)
// (Vite dev cần script inline cho hot reload nên không bật CSP strict ở đây).
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const apiProxy = {
  // Chuyển tiếp /api tới API ASP.NET Core (cổng 5080)
  '/api': { target: 'http://localhost:5080', changeOrigin: false },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true, headers: securityHeaders, proxy: apiProxy },
  preview: { port: 3000, strictPort: true, headers: securityHeaders, proxy: apiProxy },
  build: {
    sourcemap: false, // không phát hành source map -> không lộ mã nguồn gốc (§3.4)
  },
});
