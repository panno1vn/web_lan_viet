// Kiểm tra dữ liệu đầu vào phía máy chủ (bắt buộc - §0, §1.2): kích thước, định dạng, nội dung.
export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.status = 400;
  }
}

// Ký tự điều khiển (trừ xuống dòng / tab) không bao giờ hợp lệ trong dữ liệu văn bản
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/**
 * Chuẩn hóa (Unicode NFC + trim) TRƯỚC khi kiểm tra để không bị lách bộ lọc bằng
 * cách mã hóa khác nhau (§2.5), rồi kiểm tra độ dài và mẫu cho phép (whitelist).
 */
export function str(value, field, { min = 1, max = 255, pattern, multiline = false, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return '';
    throw new ValidationError(field, 'Trường này là bắt buộc.');
  }
  if (typeof value !== 'string') throw new ValidationError(field, 'Dữ liệu không hợp lệ.');
  const v = value.normalize('NFC').trim();
  if (v.length === 0 && optional) return '';
  if (v.length < min) throw new ValidationError(field, `Cần ít nhất ${min} ký tự.`);
  if (v.length > max) throw new ValidationError(field, `Tối đa ${max} ký tự.`);
  if (CONTROL_CHARS.test(v) || (!multiline && /[\r\n]/.test(v))) {
    throw new ValidationError(field, 'Chứa ký tự không hợp lệ.');
  }
  if (pattern && !pattern.test(v)) throw new ValidationError(field, 'Định dạng không hợp lệ.');
  return v;
}

export function int(value, field, { min, max }) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new ValidationError(field, `Phải là số nguyên từ ${min} đến ${max}.`);
  }
  return value;
}

export const patterns = {
  // Tên người: chữ cái (mọi ngôn ngữ), khoảng trắng, dấu nháy đơn, gạch nối, dấu chấm
  personName: /^[\p{L}][\p{L}\p{M} .'-]*$/u,
  email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,185}\.[A-Za-z]{2,24}$/,
  phone: /^(0|\+84)[0-9]{9,10}$/,
  slug: /^[a-z0-9-]{1,80}$/,
  id: /^[1-9][0-9]{0,9}$/,
};

export const email = (v, field = 'email') =>
  str(v, field, { min: 5, max: 254, pattern: patterns.email }).toLowerCase();

/** Chính sách mật khẩu: 10–72 ký tự, đủ 4 loại ký tự, không chứa tên đăng nhập (§2.4, §5.6.2) */
export function password(value, field = 'password', emailAddr = '') {
  if (typeof value !== 'string') throw new ValidationError(field, 'Mật khẩu không hợp lệ.');
  // bcrypt chỉ dùng 72 byte đầu -> giới hạn để không có phần mật khẩu bị bỏ qua
  if (value.length < 10 || Buffer.byteLength(value) > 72) {
    throw new ValidationError(field, 'Mật khẩu phải dài từ 10 ký tự (tối đa 72 byte).');
  }
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(value)).length;
  if (kinds < 4) {
    throw new ValidationError(field, 'Mật khẩu phải có chữ thường, chữ hoa, chữ số và ký tự đặc biệt.');
  }
  const local = emailAddr.split('@')[0]?.toLowerCase();
  if (local && local.length >= 3 && value.toLowerCase().includes(local)) {
    throw new ValidationError(field, 'Mật khẩu không được chứa tên đăng nhập.');
  }
  return value;
}

/** Chỉ cho phép đúng các khóa mong đợi trong body - từ chối trường lạ (chống mass assignment) */
export function onlyKeys(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('body', 'Dữ liệu gửi lên không hợp lệ.');
  }
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) throw new ValidationError(key, 'Trường không được phép.');
  }
  return body;
}
