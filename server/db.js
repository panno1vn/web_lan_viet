// Truy cập dữ liệu (DAL). Mọi truy vấn đều dùng prepared statement với tham số "?"
// -> dữ liệu người dùng KHÔNG BAO GIỜ được nối chuỗi vào câu SQL (chống SQL Injection - §2.3)
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 3000;

  CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT    NOT NULL UNIQUE CHECK (length(email) BETWEEN 5 AND 254),
    full_name      TEXT    NOT NULL CHECK (length(full_name) BETWEEN 2 AND 80),
    password_hash  TEXT    NOT NULL,
    role           TEXT    NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    failed_logins  INTEGER NOT NULL DEFAULT 0,
    locked_until   INTEGER,
    created_at     INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id_hash        TEXT    PRIMARY KEY,           -- chỉ lưu SHA-256 của token, không lưu token gốc
    user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
    csrf_token     TEXT    NOT NULL,
    captcha_answer TEXT,
    created_at     INTEGER NOT NULL,
    last_seen      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    species     TEXT    NOT NULL,
    description TEXT    NOT NULL,
    care        TEXT    NOT NULL,
    price       INTEGER NOT NULL CHECK (price > 0),
    stock       INTEGER NOT NULL CHECK (stock >= 0),
    color       TEXT    NOT NULL,
    accent      TEXT    NOT NULL,
    featured    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    total      INTEGER NOT NULL CHECK (total > 0),
    status     TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipping', 'done', 'cancelled')),
    phone      TEXT    NOT NULL,
    address    TEXT    NOT NULL,
    note       TEXT    NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    unit_price INTEGER NOT NULL CHECK (unit_price > 0),
    PRIMARY KEY (order_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    created_at INTEGER NOT NULL
  );

  -- Nhật ký kiểm toán: chỉ được thêm, KHÔNG được sửa/xóa (bài học case-study ghi log - §2.7)
  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event      TEXT    NOT NULL,
    user_id    INTEGER,
    ip         TEXT,
    user_agent TEXT,
    details    TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TRIGGER IF NOT EXISTS audit_log_no_update BEFORE UPDATE ON audit_log
    BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
  CREATE TRIGGER IF NOT EXISTS audit_log_no_delete BEFORE DELETE ON audit_log
    BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

  -- Đơn hàng đã đặt thì không cho sửa số lượng / giá (chống tấn công logic - §2.5)
  CREATE TRIGGER IF NOT EXISTS order_items_immutable BEFORE UPDATE ON order_items
    BEGIN SELECT RAISE(ABORT, 'order items are immutable'); END;
`);

const seedProducts = [
  ['ho-diep-trang-ngoc', 'Hồ điệp Trắng Ngọc', 'Hồ điệp', 'Chậu hồ điệp 3 cành hoa trắng tinh khôi, phù hợp trưng bày phòng khách, văn phòng hoặc làm quà tân gia.', 'Tưới 1 lần/tuần, đặt nơi có ánh sáng tán xạ, tránh nắng gắt trực tiếp.', 1250000, 12, '#f7f3f8', '#e8c547', 1],
  ['ho-diep-tim-hoang-gia', 'Hồ điệp Tím Hoàng Gia', 'Hồ điệp', 'Sắc tím đậm sang trọng, cánh hoa dày, giữ hoa bền từ 2 đến 3 tháng.', 'Giữ nhiệt độ 20–28°C, tưới khi giá thể khô mặt.', 1450000, 8, '#8e3c9e', '#f2d16b', 1],
  ['dendro-hong-phan', 'Dendro Hồng Phấn', 'Dendrobium', 'Dendro thân cao, chùm hoa hồng phấn dày đặc, rất dễ chăm cho người mới.', 'Ưa sáng, tưới 2–3 lần/tuần vào mùa nóng.', 420000, 25, '#e48fb4', '#fff1a8', 1],
  ['cattleya-do-ruou', 'Cattleya Đỏ Rượu', 'Cattleya', 'Được mệnh danh "nữ hoàng các loài lan", hoa to, cánh lượn sóng, hương thơm nhẹ.', 'Cần nhiều sáng, để khô ráo giữa các lần tưới.', 890000, 6, '#9b1d3a', '#f4c430', 1],
  ['vanda-xanh-lam', 'Vanda Xanh Lam', 'Vanda', 'Vanda rễ khí sinh, hoa xanh lam hiếm có với vân lưới đặc trưng.', 'Phun ẩm rễ mỗi ngày, treo nơi thoáng gió.', 760000, 10, '#5a6fd6', '#ffffff', 0],
  ['mokara-cam-hoang-hon', 'Mokara Cam Hoàng Hôn', 'Mokara', 'Mokara cam rực rỡ, ra hoa quanh năm, rất hợp cắm bình.', 'Ưa nắng, tưới đều đặn, bón phân loãng hằng tuần.', 380000, 30, '#f08a3c', '#ffe08a', 0],
  ['lan-hai-dom-vang', 'Lan Hài Đốm Vàng', 'Lan hài', 'Lan hài có túi môi độc đáo, lá đốm đẹp, loài lan quý cho người sưu tầm.', 'Ưa bóng râm, giữ giá thể ẩm nhưng không úng.', 1150000, 4, '#d9a521', '#6b3e1f', 0],
  ['oncidium-vu-nu', 'Oncidium Vũ Nữ', 'Oncidium', 'Chùm hoa vàng nhỏ như những vũ nữ đang múa, mang lại may mắn ngày Tết.', 'Ánh sáng vừa phải, tưới khi giá thể gần khô.', 320000, 40, '#f5d000', '#a0522d', 0],
];

const productCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
if (productCount === 0) {
  const insert = db.prepare(`INSERT INTO products
    (slug, name, species, description, care, price, stock, color, accent, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of seedProducts) insert.run(...p);
}

// Thực thi hàm trong transaction; lỗi giữa chừng sẽ rollback toàn bộ (đảm bảo toàn vẹn - §5.1)
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
