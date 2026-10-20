// Cấu hình đọc từ biến môi trường - KHÔNG hardcode bí mật trong mã nguồn (§2.4, §5.6.6)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

function list(value, fallback) {
  return (value ?? fallback).split(',').map((s) => s.trim()).filter(Boolean);
}

export const config = {
  isProd,
  port: Number(process.env.PORT) || (isProd ? 3000 : 3001),
  // File CSDL nằm NGOÀI thư mục public/dist (ngoài webroot - §3.4)
  dbPath: process.env.DB_PATH || path.join(__dirname, 'data', 'shop.db'),
  distDir: path.join(__dirname, '..', 'dist'),
  // Chỉ chấp nhận request thay đổi dữ liệu từ các origin này (chống CSRF, CORS chặt - §2.2, §2.6)
  allowedOrigins: list(process.env.ALLOWED_ORIGINS, 'http://localhost:3000'),
  trustProxy: process.env.TRUST_PROXY === '1',
  forceHttps: process.env.FORCE_HTTPS === '1',
  session: {
    // __Host- buộc cookie phải Secure, Path=/, không có Domain
    cookieName: isProd ? '__Host-sid' : 'sid',
    idleTimeoutMs: 30 * 60 * 1000, // hết hạn khi không hoạt động 30 phút (§3.3)
    absoluteTimeoutMs: 8 * 60 * 60 * 1000, // tối đa 8 giờ
  },
  login: {
    maxFailures: 5, // sai 5 lần liên tiếp -> khóa tài khoản (§2.4)
    lockMs: 15 * 60 * 1000,
  },
  bcryptRounds: 12,
};
