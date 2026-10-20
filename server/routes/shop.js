// Sản phẩm, đơn hàng, liên hệ
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db, transaction } from '../db.js';
import { audit } from '../security/audit.js';
import { requireAuth } from '../security/session.js';
import { str, int, email, onlyKeys, patterns, ValidationError } from '../security/validate.js';

const router = Router();

const PRODUCT_COLUMNS = 'id, slug, name, species, description, care, price, stock, color, accent, featured';

const q = {
  all: db.prepare(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY featured DESC, id LIMIT 50`),
  featured: db.prepare(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE featured = 1 ORDER BY id LIMIT 8`),
  // Tìm kiếm có tham số; ký tự đại diện % _ trong từ khóa được escape để không thành mẫu LIKE
  search: db.prepare(`SELECT ${PRODUCT_COLUMNS} FROM products
    WHERE name LIKE ? ESCAPE '\\' OR species LIKE ? ESCAPE '\\'
    ORDER BY featured DESC, id LIMIT 50`),
  bySlug: db.prepare(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = ?`),
  byId: db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?'),
  decStock: db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'),
  insertOrder: db.prepare(`INSERT INTO orders (user_id, total, phone, address, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`),
  insertItem: db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)`),
  myOrders: db.prepare(`SELECT id, total, status, created_at FROM orders
    WHERE user_id = ? ORDER BY id DESC LIMIT 100`),
  // Luôn lọc theo user_id của phiên -> không xem được đơn của người khác bằng cách đổi id (IDOR, A01)
  myOrder: db.prepare(`SELECT id, total, status, phone, address, note, created_at FROM orders
    WHERE id = ? AND user_id = ?`),
  orderItems: db.prepare(`SELECT p.name, p.slug, i.quantity, i.unit_price FROM order_items i
    JOIN products p ON p.id = i.product_id WHERE i.order_id = ?`),
  insertContact: db.prepare(`INSERT INTO contact_messages (name, email, message, created_at)
    VALUES (?, ?, ?, ?)`),
};

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau.' },
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Bạn đặt hàng quá nhiều lần, vui lòng thử lại sau.' },
});

router.get('/products', (req, res) => {
  if (req.query.featured === '1') return res.json({ products: q.featured.all() });
  const raw = typeof req.query.q === 'string' ? req.query.q : '';
  if (!raw.trim()) return res.json({ products: q.all.all() });
  const term = str(raw, 'q', { max: 60 });
  const like = `%${term.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
  res.json({ products: q.search.all(like, like) });
});

router.get('/products/:slug', (req, res) => {
  const slug = str(req.params.slug, 'slug', { max: 80, pattern: patterns.slug });
  const product = q.bySlug.get(slug);
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json({ product });
});

// Đặt hàng: giá và tổng tiền luôn tính lại ở máy chủ từ CSDL, KHÔNG tin giá do client gửi (§2.5)
router.post('/orders', requireAuth, orderLimiter, (req, res) => {
  const body = onlyKeys(req.body, ['items', 'phone', 'address', 'note']);
  const phone = str(body.phone, 'phone', { max: 13, pattern: patterns.phone });
  const address = str(body.address, 'address', { min: 10, max: 200 });
  const note = str(body.note, 'note', { max: 300, multiline: true, optional: true });

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    throw new ValidationError('items', 'Giỏ hàng không hợp lệ.');
  }
  const seen = new Set();
  const items = body.items.map((it) => {
    onlyKeys(it, ['productId', 'quantity']);
    const productId = int(it.productId, 'productId', { min: 1, max: 1e9 });
    const quantity = int(it.quantity, 'quantity', { min: 1, max: 20 });
    if (seen.has(productId)) throw new ValidationError('items', 'Sản phẩm bị trùng trong giỏ.');
    seen.add(productId);
    return { productId, quantity };
  });

  const orderId = transaction(() => {
    let total = 0;
    const priced = items.map(({ productId, quantity }) => {
      const p = q.byId.get(productId);
      if (!p) throw new ValidationError('items', 'Sản phẩm không tồn tại.');
      if (p.stock < quantity) {
        const err = new ValidationError('items', `"${p.name}" chỉ còn ${p.stock} chậu.`);
        err.status = 409;
        throw err;
      }
      total += p.price * quantity;
      return { productId, quantity, price: p.price };
    });
    const info = q.insertOrder.run(req.user.id, total, phone, address, note, Date.now());
    const id = Number(info.lastInsertRowid);
    for (const it of priced) {
      const upd = q.decStock.run(it.quantity, it.productId, it.quantity);
      if (upd.changes !== 1) throw new ValidationError('items', 'Sản phẩm vừa hết hàng.');
      q.insertItem.run(id, it.productId, it.quantity, it.price);
    }
    return id;
  });

  audit('order_created', req, { orderId });
  res.status(201).json({ orderId });
});

router.get('/orders', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ orders: q.myOrders.all(req.user.id) });
});

router.get('/orders/:id', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const id = Number(str(req.params.id, 'id', { max: 10, pattern: patterns.id }));
  const order = q.myOrder.get(id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  res.json({ order, items: q.orderItems.all(id) });
});

router.post('/contact', contactLimiter, (req, res) => {
  const body = onlyKeys(req.body, ['name', 'email', 'message']);
  const name = str(body.name, 'name', { min: 2, max: 80, pattern: patterns.personName });
  const mail = email(body.email);
  const message = str(body.message, 'message', { min: 10, max: 2000, multiline: true });
  q.insertContact.run(name, mail, message, Date.now());
  res.status(201).json({ message: 'Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm.' });
});

export default router;
