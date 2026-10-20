const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export const formatPrice = (value) => vnd.format(value);

export const formatDate = (ms) =>
  new Date(ms).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const ORDER_STATUS = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

/**
 * Chỉ cho phép chuyển hướng tới đường dẫn nội bộ ("/..."), chặn "//evil.com" hay "https://..."
 * -> chống open redirect sau khi đăng nhập.
 */
export function safeRedirect(path, fallback = '/') {
  if (typeof path !== 'string') return fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  return path;
}

// Kiểm tra phía client chỉ để trải nghiệm tốt hơn - máy chủ luôn kiểm tra lại (§0)
export const rules = {
  email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,185}\.[A-Za-z]{2,24}$/,
  phone: /^(0|\+84)[0-9]{9,10}$/,
  name: /^[\p{L}][\p{L}\p{M} .'-]*$/u,
};

export function passwordProblems(pw) {
  const problems = [];
  if (pw.length < 10) problems.push('ít nhất 10 ký tự');
  if (!/[a-z]/.test(pw)) problems.push('chữ thường');
  if (!/[A-Z]/.test(pw)) problems.push('chữ hoa');
  if (!/[0-9]/.test(pw)) problems.push('chữ số');
  if (!/[^A-Za-z0-9]/.test(pw)) problems.push('ký tự đặc biệt');
  return problems;
}
