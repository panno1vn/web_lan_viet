// Quản lý phiên (§3.3):
//  - token sinh bằng CSPRNG 256 bit, không mang ý nghĩa, không phụ thuộc thời gian
//  - CSDL chỉ lưu SHA-256 của token -> lộ bảng sessions cũng không chiếm được phiên
//  - cookie HttpOnly + SameSite=Strict + Secure (production), không bao giờ đặt token lên URL
//  - hết hạn khi không hoạt động + hết hạn tuyệt đối; đăng nhập thì cấp phiên mới (chống session fixation)
//  - mỗi người dùng chỉ có một phiên: đăng nhập mới hủy các phiên cũ
import crypto from 'node:crypto';
import { db } from '../db.js';
import { config } from '../config.js';
import { audit } from './audit.js';

const { cookieName, idleTimeoutMs, absoluteTimeoutMs } = config.session;

const q = {
  find: db.prepare('SELECT * FROM sessions WHERE id_hash = ?'),
  insert: db.prepare(`INSERT INTO sessions (id_hash, user_id, csrf_token, created_at, last_seen)
    VALUES (?, ?, ?, ?, ?)`),
  touch: db.prepare('UPDATE sessions SET last_seen = ? WHERE id_hash = ?'),
  remove: db.prepare('DELETE FROM sessions WHERE id_hash = ?'),
  removeForUser: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  removeExpired: db.prepare('DELETE FROM sessions WHERE last_seen < ? OR created_at < ?'),
  setCaptcha: db.prepare('UPDATE sessions SET captcha_answer = ? WHERE id_hash = ?'),
  // Quyền được đọc lại từ CSDL ở MỖI request, không cache trong phiên (§2.5: hạ quyền có hiệu lực ngay)
  user: db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?'),
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict',
    path: '/',
  };
}

/** Middleware: nạp phiên (nếu có) và người dùng tương ứng vào req.session / req.user */
export function loadSession(req, res, next) {
  req.session = null;
  req.user = null;
  const token = readCookie(req, cookieName);
  // Token hợp lệ luôn là base64url 43 ký tự - bỏ qua mọi giá trị khác
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    const idHash = sha256(token);
    const row = q.find.get(idHash);
    const now = Date.now();
    if (row) {
      if (now - row.last_seen > idleTimeoutMs || now - row.created_at > absoluteTimeoutMs) {
        q.remove.run(idHash);
        res.clearCookie(cookieName, cookieOptions());
      } else {
        q.touch.run(now, idHash);
        req.session = row;
        if (row.user_id) req.user = q.user.get(row.user_id) ?? null;
      }
    }
  }
  next();
}

function createSession(res, userId) {
  const token = randomToken();
  const idHash = sha256(token);
  const csrfToken = randomToken();
  const now = Date.now();
  q.insert.run(idHash, userId, csrfToken, now, now);
  res.cookie(cookieName, token, { ...cookieOptions(), maxAge: absoluteTimeoutMs });
  return q.find.get(idHash);
}

/** Đảm bảo khách (kể cả chưa đăng nhập) có phiên để gắn CSRF token / CAPTCHA */
export function ensureSession(req, res) {
  if (!req.session) req.session = createSession(res, null);
  return req.session;
}

/** Đăng nhập thành công: hủy phiên cũ + mọi phiên khác của user, cấp phiên mới */
export function startUserSession(req, res, userId) {
  if (req.session) q.remove.run(req.session.id_hash);
  q.removeForUser.run(userId);
  req.session = createSession(res, userId);
  req.user = q.user.get(userId);
  return req.session;
}

export function destroySession(req, res) {
  if (req.session) q.remove.run(req.session.id_hash);
  req.session = null;
  req.user = null;
  res.clearCookie(cookieName, cookieOptions());
}

export function setCaptchaAnswer(session, answer) {
  q.setCaptcha.run(answer, session.id_hash);
}

export function cleanupExpiredSessions() {
  const now = Date.now();
  q.removeExpired.run(now - idleTimeoutMs, now - absoluteTimeoutMs);
}

/** Bắt buộc đăng nhập - dùng cho mọi API cần quyền */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
  next();
}

/** Chống CSRF (§2.2): token đồng bộ lưu trong phiên + kiểm tra header Origin */
export function csrfProtection(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') return next();

  const origin = req.get('origin');
  if (origin && !config.allowedOrigins.includes(origin)) {
    audit('csrf_bad_origin', req, { origin: origin.slice(0, 100), path: req.path });
    return res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
  }

  const sent = req.get('x-csrf-token');
  const expected = req.session?.csrf_token;
  const ok =
    typeof sent === 'string' &&
    typeof expected === 'string' &&
    sent.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
  if (!ok) {
    audit('csrf_invalid_token', req, { path: req.path });
    return res.status(403).json({ error: 'Phiên làm việc đã hết hạn, vui lòng tải lại trang.', code: 'CSRF' });
  }
  next();
}
