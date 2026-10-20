import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import FormField from '../components/FormField.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatPrice, ORDER_STATUS, passwordProblems } from '../utils/format.js';

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    const problems = passwordProblems(form.newPassword);
    if (problems.length) errs.newPassword = `Mật khẩu còn thiếu: ${problems.join(', ')}.`;
    if (form.confirm !== form.newPassword) errs.confirm = 'Mật khẩu nhập lại không khớp.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const data = await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setStatus({ type: 'success', text: data.message });
    } catch (err) {
      if (err.field === 'currentPassword' || err.field === 'newPassword') setErrors({ [err.field]: err.message });
      else setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <h2>Đổi mật khẩu</h2>
      <FormField label="Mật khẩu hiện tại" type="password" value={form.currentPassword} onChange={set('currentPassword')} maxLength={72} autoComplete="current-password" error={errors.currentPassword} />
      <FormField label="Mật khẩu mới" type="password" value={form.newPassword} onChange={set('newPassword')} maxLength={72} autoComplete="new-password" error={errors.newPassword} />
      <FormField label="Nhập lại mật khẩu mới" type="password" value={form.confirm} onChange={set('confirm')} maxLength={72} autoComplete="new-password" error={errors.confirm} />
      {status.text && <p className={`alert alert--${status.type}`}>{status.text}</p>}
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? 'Đang lưu…' : 'Cập nhật mật khẩu'}
      </button>
    </form>
  );
}

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders')
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <section className="page-hero page-hero--compact">
        <div className="container">
          <p className="eyebrow">Tài khoản</p>
          <h1>Xin chào, {user.fullName}</h1>
          <p>{user.email}</p>
        </div>
      </section>
      <section className="section">
        <div className="container two-col">
          <div>
            <h2>Đơn hàng của tôi</h2>
            {error && <p className="alert alert--error">{error}</p>}
            {!orders ? (
              <p className="page-status">Đang tải…</p>
            ) : orders.length === 0 ? (
              <p>
                Bạn chưa có đơn hàng nào. <Link to="/san-pham">Mua sắm ngay →</Link>
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Ngày đặt</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link to={`/tai-khoan/don-hang/${o.id}`}>#{o.id}</Link>
                      </td>
                      <td>{formatDate(o.created_at)}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td>{ORDER_STATUS[o.status] ?? o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ChangePassword />
        </div>
      </section>
    </div>
  );
}
