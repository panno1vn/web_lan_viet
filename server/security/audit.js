// Ghi nhật ký sự kiện bảo mật (A09:2021, §5.7.4). KHÔNG bao giờ ghi mật khẩu/token vào log.
import { db } from '../db.js';

const insert = db.prepare(`INSERT INTO audit_log (event, user_id, ip, user_agent, details, created_at)
  VALUES (?, ?, ?, ?, ?, ?)`);

export function audit(event, req, details = {}, userId = req?.user?.id ?? null) {
  const ip = req?.ip ?? null;
  const ua = String(req?.get?.('user-agent') ?? '').slice(0, 200);
  try {
    insert.run(event, userId, ip, ua, JSON.stringify(details), Date.now());
  } catch (err) {
    console.error('[audit] failed to write log:', err.message);
  }
  console.log('[audit]', JSON.stringify({ event, userId, ip, details }));
}
