// Xác thực người dùng (§2.4, §3.2, §3.3)
import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { config } from '../config.js';
import { audit } from '../security/audit.js';
import { str, email, password, onlyKeys, patterns, ValidationError } from '../security/validate.js';
import {
  ensureSession,
  startUserSession,
  destroySession,
  setCaptchaAnswer,
  requireAuth,
} from '../security/session.js';

const router = Router();

const q = {
  byEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  byId: db.prepare('SELECT * FROM users WHERE id = ?'),
  insert: db.prepare(`INSERT INTO users (email, full_name, password_hash, created_at) VALUES (?, ?, ?, ?)`),
  fail: db.prepare('UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ?'),
  lock: db.prepare('UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?'),
  reset: db.prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?'),
  setPassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
};

// Hash giả để so sánh khi email không tồn tại -> thời gian phản hồi như nhau,
// kẻ tấn công không dò được email nào đã đăng ký dựa vào thời gian (§2.4)
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), config.bcryptRounds);

const limiterMessage = { error: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau.' };

// Giới hạn theo IP: chống vét cạn mật khẩu và chống kẻ xấu cố tình khóa tài khoản người khác (§5.4)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: limiterMessage,
  handler: (req, res, _next, options) => {
    audit('login_rate_limited', req);
    res.status(options.statusCode).json(options.message);
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: limiterMessage,
});

const publicUser = (u) => ({ id: u.id, email: u.email, fullName: u.full_name, role: u.role });

// CSRF token cho SPA. Token nằm trong body JSON (không đặt lên URL)
router.get('/csrf', (req, res) => {
  const session = ensureSession(req, res);
  res.set('Cache-Control', 'no-store');
  res.json({ csrfToken: session.csrf_token });
});

// CAPTCHA đơn giản do máy chủ sinh (chống đăng ký tự động - §2.4). Đáp án lưu ở phiên, dùng một lần.
router.get('/captcha', (req, res) => {
  const session = ensureSession(req, res);
  const a = crypto.randomInt(2, 20);
  const b = crypto.randomInt(2, 10);
  setCaptchaAnswer(session, String(a + b));
  res.set('Cache-Control', 'no-store');
  res.json({ question: `${a} + ${b} = ?` });
});

router.get('/auth/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.post('/auth/register', registerLimiter, async (req, res) => {
  const body = onlyKeys(req.body, ['fullName', 'email', 'password', 'captcha']);
  const fullName = str(body.fullName, 'fullName', { min: 2, max: 80, pattern: patterns.personName });
  const mail = email(body.email);
  const pass = password(body.password, 'password', mail);
  const captcha = str(body.captcha, 'captcha', { max: 4, pattern: /^[0-9]+$/ });

  const expected = req.session?.captcha_answer;
  if (req.session) setCaptchaAnswer(req.session, null); // đáp án chỉ dùng được một lần
  if (!expected || captcha !== expected) {
    throw new ValidationError('captcha', 'Mã xác nhận không đúng.');
  }

  const hash = await bcrypt.hash(pass, config.bcryptRounds);
  try {
    const info = q.insert.run(mail, fullName, hash, Date.now());
    audit('register', req, {}, Number(info.lastInsertRowid));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      // Thông báo chung chung, không xác nhận email đã tồn tại
      return res.status(400).json({ error: 'Không thể đăng ký với thông tin này. Vui lòng kiểm tra lại.' });
    }
    throw err;
  }
  res.status(201).json({ message: 'Đăng ký thành công. Vui lòng đăng nhập.' });
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  const body = onlyKeys(req.body, ['email', 'password']);
  const generic = { error: 'Email hoặc mật khẩu không đúng.' };
  let mail;
  try {
    mail = email(body.email);
  } catch {
    return res.status(401).json(generic);
  }
  const pass = typeof body.password === 'string' ? body.password.slice(0, 200) : '';

  const user = q.byEmail.get(mail);
  const now = Date.now();

  if (user?.locked_until && user.locked_until > now) {
    audit('login_blocked_locked', req, {}, user.id);
    const minutes = Math.ceil((user.locked_until - now) / 60000);
    return res.status(423).json({
      error: `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ${minutes} phút.`,
    });
  }

  const ok = await bcrypt.compare(pass, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    if (user) {
      q.fail.run(user.id);
      if (user.failed_logins + 1 >= config.login.maxFailures) {
        q.lock.run(now + config.login.lockMs, user.id);
        audit('account_locked', req, {}, user.id);
      }
    }
    audit('login_failed', req, {}, user?.id ?? null);
    return res.status(401).json(generic);
  }

  q.reset.run(user.id);
  const session = startUserSession(req, res, user.id);
  audit('login_success', req, {}, user.id);
  res.json({ user: publicUser(user), csrfToken: session.csrf_token });
});

router.post('/auth/logout', (req, res) => {
  if (req.user) audit('logout', req);
  destroySession(req, res);
  res.json({ ok: true });
});

// Đổi mật khẩu: BẮT BUỘC nhập đúng mật khẩu hiện tại (bài học case-study §2.7),
// sau đó hủy mọi phiên cũ và cấp phiên mới.
router.post('/auth/change-password', requireAuth, async (req, res) => {
  const body = onlyKeys(req.body, ['currentPassword', 'newPassword']);
  const user = q.byId.get(req.user.id);
  const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  if (!current || !(await bcrypt.compare(current, user.password_hash))) {
    audit('change_password_failed', req);
    throw new ValidationError('currentPassword', 'Mật khẩu hiện tại không đúng.');
  }
  const next = password(body.newPassword, 'newPassword', user.email);
  if (await bcrypt.compare(next, user.password_hash)) {
    throw new ValidationError('newPassword', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  }
  q.setPassword.run(await bcrypt.hash(next, config.bcryptRounds), user.id);
  const session = startUserSession(req, res, user.id);
  audit('change_password', req);
  res.json({ message: 'Đổi mật khẩu thành công.', csrfToken: session.csrf_token });
});

export default router;
