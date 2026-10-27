import axios from 'axios';

// Một axios instance dùng chung cho toàn bộ ứng dụng, gọi tới API ASP.NET Core cùng origin (/api).
// - Cookie đăng nhập là HttpOnly nên JavaScript không đọc được (§2.1); trình duyệt tự gửi kèm.
// - Mọi request thay đổi dữ liệu (POST/PUT/DELETE) được interceptor gắn anti-forgery token
//   vào header X-CSRF-Token (§2.2).
export const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

let csrfToken = null;

export class ApiError extends Error {
  constructor(message, status, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

async function fetchCsrf() {
  const { data } = await axios.get('/api/csrf', { withCredentials: true });
  csrfToken = data.csrfToken;
  return csrfToken;
}

const UNSAFE = ['post', 'put', 'delete', 'patch'];

// Request interceptor: gắn CSRF token cho các phương thức thay đổi dữ liệu
http.interceptors.request.use(async (config) => {
  if (UNSAFE.includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken ?? (await fetchCsrf());
  }
  return config;
});

// Response interceptor:
//  - lưu CSRF token mới (máy chủ cấp lại sau khi đăng nhập/đăng xuất/đổi mật khẩu)
//  - token hết hạn => lấy token mới và gửi lại request đúng một lần
//  - chuẩn hóa lỗi thành ApiError { message, status, field }
http.interceptors.response.use(
  (response) => {
    if (typeof response.data?.csrfToken === 'string') csrfToken = response.data.csrfToken;
    return response;
  },
  async (error) => {
    const { config, response } = error;
    if (response?.status === 403 && response.data?.code === 'CSRF' && !config._retried) {
      config._retried = true;
      csrfToken = null;
      return http(config);
    }
    if (!response) {
      throw new ApiError('Không kết nối được máy chủ. Vui lòng thử lại.', 0);
    }
    throw new ApiError(response.data?.error || 'Đã có lỗi xảy ra.', response.status, response.data?.field ?? undefined);
  },
);
