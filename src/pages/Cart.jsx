import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import OrchidArt from '../components/OrchidArt.jsx';
import FormField from '../components/FormField.jsx';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice, rules } from '../utils/format.js';

export default function Cart() {
  const { items, update, remove, clear, MAX_QTY } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [form, setForm] = useState({ phone: '', address: '', note: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Lấy giá hiện tại từ máy chủ, không dùng giá lưu trên trình duyệt
  useEffect(() => {
    api('/products')
      .then((d) => setCatalog(new Map(d.products.map((p) => [p.id, p]))))
      .catch((e) => setServerError(e.message));
  }, []);

  const lines = useMemo(
    () => (catalog ? items.map((it) => ({ ...it, product: catalog.get(it.productId) })).filter((l) => l.product) : []),
    [items, catalog],
  );
  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);

  function validate() {
    const e = {};
    if (!rules.phone.test(form.phone.trim())) e.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
    if (form.address.trim().length < 10) e.address = 'Địa chỉ cần ít nhất 10 ký tự.';
    if (form.note.length > 300) e.note = 'Ghi chú tối đa 300 ký tự.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleOrder(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { orderId } = await api('/orders', {
        method: 'POST',
        body: {
          // Chỉ gửi mã sản phẩm + số lượng; máy chủ tự tính giá
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        },
      });
      clear();
      navigate(`/tai-khoan/don-hang/${orderId}`, { state: { justOrdered: true } });
    } catch (err) {
      if (err.field && err.field in form) setErrors({ [err.field]: err.message });
      else setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page">
      <section className="page-hero page-hero--compact">
        <div className="container">
          <h1>Giỏ hàng</h1>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {serverError && <p className="alert alert--error">{serverError}</p>}
          {!catalog ? (
            <p className="page-status">Đang tải…</p>
          ) : lines.length === 0 ? (
            <div className="empty">
              <p>Giỏ hàng của bạn đang trống.</p>
              <Link to="/san-pham" className="btn btn--primary">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="cart">
              <ul className="cart__lines">
                {lines.map(({ productId, quantity, product }) => (
                  <li key={productId} className="cart-line">
                    <OrchidArt color={product.color} accent={product.accent} size={64} />
                    <div className="cart-line__info">
                      <Link to={`/san-pham/${product.slug}`}>{product.name}</Link>
                      <small>{formatPrice(product.price)}</small>
                    </div>
                    <label className="sr-only" htmlFor={`qty-${productId}`}>
                      Số lượng {product.name}
                    </label>
                    <input
                      id={`qty-${productId}`}
                      type="number"
                      min={1}
                      max={Math.min(product.stock, MAX_QTY)}
                      value={quantity}
                      onChange={(e) => update(productId, Number(e.target.value))}
                    />
                    <strong className="cart-line__sum">{formatPrice(product.price * quantity)}</strong>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(productId)}>
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>

              <aside className="cart__checkout">
                <p className="cart__total">
                  Tạm tính <strong>{formatPrice(total)}</strong>
                </p>
                <small>Tổng tiền cuối cùng do hệ thống xác nhận khi đặt hàng.</small>
                {user ? (
                  <form onSubmit={handleOrder} noValidate>
                    <FormField label="Số điện thoại" type="tel" value={form.phone} onChange={set('phone')} maxLength={13} autoComplete="tel" error={errors.phone} />
                    <FormField label="Địa chỉ giao hàng" value={form.address} onChange={set('address')} maxLength={200} autoComplete="street-address" error={errors.address} />
                    <FormField label="Ghi chú (không bắt buộc)" as="textarea" rows={3} value={form.note} onChange={set('note')} maxLength={300} error={errors.note} />
                    <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
                      {submitting ? 'Đang đặt hàng…' : 'Đặt hàng'}
                    </button>
                  </form>
                ) : (
                  <p>
                    Vui lòng <Link to="/dang-nhap" state={{ from: '/gio-hang' }}>đăng nhập</Link> để đặt hàng.
                  </p>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
