// Máy chủ Express: cung cấp API /api/* và (ở production) phục vụ bản build React.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { audit } from './security/audit.js';
import { ValidationError } from './security/validate.js';
import { loadSession, csrfProtection, cleanupExpiredSessions } from './security/session.js';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shop.js';

const app = express();
app.set('trust proxy', config.trustProxy ? 1 : false);
app.disable('x-powered-by'); // không để lộ công nghệ máy chủ

// Buộc HTTPS khi chạy sau reverse proxy có TLS (§1.1, §2.6)
if (config.forceHttps) {
  app.use((req, res, next) => (req.secure ? next() : res.redirect(301, `https://${req.hostname}${req.originalUrl}`)));
}

// HTTP security headers (§2.1, §2.6): CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy...
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // chống clickjacking
        ...(config.forceHttps ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  }),
);
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

// Chỉ cho phép phương thức cần dùng; khóa PUT/DELETE/TRACE/... (§3.1)
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'POST'].includes(req.method)) return next();
  res.set('Allow', 'GET, HEAD, POST').status(405).json({ error: 'Phương thức không được hỗ trợ.' });
});

// Giới hạn chung chống lạm dụng / DoS qua lớp ứng dụng (§5.4)
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  }),
);

// Chỉ nhận JSON, giới hạn kích thước body 10 KB
app.use('/api', express.json({ limit: '10kb', strict: true, type: 'application/json' }));
app.use('/api', (req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Chỉ chấp nhận dữ liệu JSON.' });
  }
  next();
});

app.use('/api', loadSession, csrfProtection);
app.use('/api', authRoutes);
app.use('/api', shopRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy.' }));

// Production: phục vụ bản build React và trả index.html cho mọi đường dẫn của SPA,
// để truy cập trực tiếp http://localhost:3000/about-us vẫn hiển thị đúng trang.
if (config.isProd) {
  const indexHtml = path.join(config.distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.error('Chưa có thư mục dist/. Hãy chạy "npm run build" trước.');
    process.exit(1);
  }
  // express.static không bao giờ liệt kê thư mục; chặn dotfiles (.git, .env...) - §3.1, §3.4
  app.use(express.static(config.distDir, { index: false, dotfiles: 'deny', maxAge: '7d', immutable: true }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.set('Cache-Control', 'no-cache').sendFile(indexHtml);
  });
}

// Xử lý lỗi tập trung: KHÔNG trả stack trace/chi tiết lỗi cho client (§4.4, §4.6)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: err.message, field: err.field });
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'Dữ liệu gửi lên không hợp lệ.' });
  }
  console.error('[error]', req.method, req.path, err);
  audit('server_error', req, { path: req.path });
  res.status(500).json({ error: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
});

setInterval(cleanupExpiredSessions, 10 * 60 * 1000).unref();

app.listen(config.port, () => {
  console.log(`API server: http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`);
});
