// Gọi API cùng origin. Cookie phiên là HttpOnly nên JavaScript không đọc được (§2.1);
// mọi request thay đổi dữ liệu đều kèm CSRF token trong header (§2.2).
let csrfToken = null;

export class ApiError extends Error {
  constructor(message, status, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

async function fetchCsrf() {
  const res = await fetch('/api/csrf', { credentials: 'same-origin' });
  if (!res.ok) throw new ApiError('Không kết nối được máy chủ.', res.status);
  csrfToken = (await res.json()).csrfToken;
  return csrfToken;
}

export function setCsrfToken(token) {
  csrfToken = token;
}

export async function api(path, { method = 'GET', body } = {}, retried = false) {
  const headers = { Accept: 'application/json' };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['X-CSRF-Token'] = csrfToken ?? (await fetchCsrf());
  }

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Vui lòng thử lại.', 0);
  }

  const data = await res.json().catch(() => ({}));

  // Phiên/CSRF token hết hạn -> lấy token mới và thử lại đúng một lần
  if (res.status === 403 && data.code === 'CSRF' && !retried) {
    await fetchCsrf();
    return api(path, { method, body }, true);
  }
  if (!res.ok) throw new ApiError(data.error || 'Đã có lỗi xảy ra.', res.status, data.field);
  if (typeof data.csrfToken === 'string') csrfToken = data.csrfToken;
  return data;
}
