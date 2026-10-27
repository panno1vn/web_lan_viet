import { http } from './client.js';

// Các hàm gọi API, nhóm theo tài nguyên. Mỗi hàm dùng đúng phương thức HTTP của Axios:
//   http.get    -> lấy dữ liệu
//   http.post   -> tạo mới
//   http.put    -> cập nhật
//   http.delete -> xóa / hủy
// Tham số trên URL luôn qua encodeURIComponent hoặc ép kiểu số để không chèn được đường dẫn lạ.

const id = (value) => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('Mã không hợp lệ');
  return n;
};

export const authApi = {
  me: () => http.get('/auth/me').then((r) => r.data.user),
  captcha: () => http.get('/captcha').then((r) => r.data),
  register: (body) => http.post('/auth/register', body).then((r) => r.data),
  login: (email, password) => http.post('/auth/login', { email, password }).then((r) => r.data.user),
  logout: () => http.post('/auth/logout').then((r) => r.data),
  updateProfile: (fullName) => http.put('/auth/profile', { fullName }).then((r) => r.data),
  changePassword: (currentPassword, newPassword) =>
    http.put('/auth/password', { currentPassword, newPassword }).then((r) => r.data),
};

export const productApi = {
  list: (params = {}) => http.get('/products', { params }).then((r) => r.data.products),
  featured: () => http.get('/products', { params: { featured: true } }).then((r) => r.data.products),
  get: (slug) => http.get(`/products/${encodeURIComponent(slug)}`).then((r) => r.data.product),
  // Quản trị viên
  create: (product) => http.post('/products', product).then((r) => r.data.product),
  update: (productId, product) => http.put(`/products/${id(productId)}`, product).then((r) => r.data.product),
  remove: (productId) => http.delete(`/products/${id(productId)}`),
};

export const orderApi = {
  mine: () => http.get('/orders').then((r) => r.data.orders),
  get: (orderId) => http.get(`/orders/${id(orderId)}`).then((r) => r.data),
  create: (order) => http.post('/orders', order).then((r) => r.data.orderId),
  cancel: (orderId) => http.delete(`/orders/${id(orderId)}`).then((r) => r.data),
  // Quản trị viên
  all: () => http.get('/orders/all').then((r) => r.data.orders),
  updateStatus: (orderId, status) => http.put(`/orders/${id(orderId)}/status`, { status }).then((r) => r.data),
};

export const contactApi = {
  send: (message) => http.post('/contact', message).then((r) => r.data),
  // Quản trị viên
  list: () => http.get('/contact').then((r) => r.data.messages),
  remove: (messageId) => http.delete(`/contact/${id(messageId)}`),
};
