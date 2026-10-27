import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import FormField from '../components/FormField.jsx';
import { contactApi, orderApi, productApi } from '../api/services.js';
import { formatDate, formatPrice, ORDER_STATUS } from '../utils/format.js';

// Trang quản trị. Ẩn/hiện trang chỉ để tiện giao diện; máy chủ mới là nơi kiểm tra quyền admin
// trên MỖI request ([Authorize(Roles = "admin")]) - khách thường gọi API sẽ nhận 403.

const EMPTY_PRODUCT = {
  slug: '', name: '', species: '', description: '', care: '',
  price: 100000, stock: 10, color: '#c2569b', accent: '#f2c94c', featured: false,
};

const TABS = [
  { key: 'products', label: 'Sản phẩm' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'messages', label: 'Lời nhắn' },
];

function ProductForm({ initial, onSaved, onCancel }) {
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(() => (initial ? { ...EMPTY_PRODUCT, ...initial } : EMPTY_PRODUCT));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key, cast = (v) => v) => (e) =>
    setForm((f) => ({ ...f, [key]: cast(e.target.type === 'checkbox' ? e.target.checked : e.target.value) }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setServerError('');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
      setErrors({ slug: 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch nối.' });
      return;
    }
    const body = {
      slug: form.slug,
      name: form.name.trim(),
      species: form.species.trim(),
      description: form.description.trim(),
      care: form.care.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      color: form.color,
      accent: form.accent,
      featured: Boolean(form.featured),
    };
    setBusy(true);
    try {
      // PUT để cập nhật sản phẩm đã có, POST để tạo mới
      const saved = editing ? await productApi.update(initial.id, body) : await productApi.create(body);
      onSaved(saved, editing);
    } catch (err) {
      if (err.field) setErrors({ [err.field]: err.message });
      else setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card admin-form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? `Sửa: ${initial.name}` : 'Thêm sản phẩm mới'}</h2>
      <div className="admin-form__grid">
        <FormField label="Tên sản phẩm" value={form.name} onChange={set('name')} maxLength={100} error={errors.name} />
        <FormField label="Slug (đường dẫn)" value={form.slug} onChange={set('slug')} maxLength={80} error={errors.slug} hint="vd: ho-diep-vang-chanh" />
        <FormField label="Dòng lan" value={form.species} onChange={set('species')} maxLength={50} error={errors.species} />
        <FormField label="Giá (₫)" type="number" min={1000} step={1000} value={form.price} onChange={set('price')} error={errors.price} />
        <FormField label="Tồn kho" type="number" min={0} value={form.stock} onChange={set('stock')} error={errors.stock} />
        <div className="admin-form__colors">
          <FormField label="Màu cánh" type="color" value={form.color} onChange={set('color')} error={errors.color} />
          <FormField label="Màu nhụy" type="color" value={form.accent} onChange={set('accent')} error={errors.accent} />
        </div>
      </div>
      <FormField label="Mô tả" as="textarea" rows={3} value={form.description} onChange={set('description')} maxLength={1000} error={errors.description} />
      <FormField label="Cách chăm sóc" as="textarea" rows={2} value={form.care} onChange={set('care')} maxLength={500} error={errors.care} />
      <label className="admin-check">
        <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Đánh dấu “Bán chạy”
      </label>
      {serverError && <p className="alert alert--error">{serverError}</p>}
      <div className="admin-form__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Hủy</button>
      </div>
    </form>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null); // null: đóng form, {}: thêm mới, product: sửa
  const [notice, setNotice] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    productApi.list().then(setProducts).catch((e) => setNotice({ type: 'error', text: e.message }));
  }, []);
  useEffect(load, [load]);

  function handleSaved(product, wasEditing) {
    setEditing(null);
    setNotice({ type: 'success', text: wasEditing ? `Đã cập nhật “${product.name}”.` : `Đã thêm “${product.name}”.` });
    load();
  }

  // DELETE /api/products/{id}
  async function handleDelete(product) {
    if (!window.confirm(`Xóa sản phẩm “${product.name}”?`)) return;
    try {
      await productApi.remove(product.id);
      setNotice({ type: 'success', text: `Đã xóa “${product.name}”.` });
      load();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <p>{products ? `${products.length} sản phẩm` : 'Đang tải…'}</p>
        {!editing && <button type="button" className="btn btn--primary" onClick={() => setEditing({})}>+ Thêm sản phẩm</button>}
      </div>
      {notice.text && <p className={`alert alert--${notice.type}`} role="status">{notice.text}</p>}
      {editing && (
        <ProductForm key={editing.id ?? 'new'} initial={editing.id ? editing : null} onSaved={handleSaved} onCancel={() => setEditing(null)} />
      )}
      {products && (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr><th>Sản phẩm</th><th>Dòng lan</th><th>Giá</th><th>Tồn kho</th><th /></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="admin-swatch" aria-hidden="true">
                      <svg width="14" height="14"><circle cx="7" cy="7" r="7" fill={p.color} /></svg>
                    </span>
                    <Link to={`/san-pham/${p.slug}`}>{p.name}</Link>
                    {p.featured && <small className="admin-tag">Bán chạy</small>}
                  </td>
                  <td>{p.species}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td className={p.stock === 0 ? 'admin-out' : ''}>{p.stock}</td>
                  <td className="admin-actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(p)}>Sửa</button>
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDelete(p)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const NEXT_STATUS = { pending: 'shipping', shipping: 'done' };

function OrdersTab() {
  const [orders, setOrders] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    orderApi.all().then(setOrders).catch((e) => setNotice({ type: 'error', text: e.message }));
  }, []);
  useEffect(load, [load]);

  // PUT /api/orders/{id}/status
  async function advance(order) {
    const next = NEXT_STATUS[order.status];
    try {
      await orderApi.updateStatus(order.id, next);
      setNotice({ type: 'success', text: `Đơn #${order.id}: ${ORDER_STATUS[next]}.` });
      load();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  if (!orders) return <p className="page-status">{notice.text || 'Đang tải…'}</p>;
  return (
    <>
      {notice.text && <p className={`alert alert--${notice.type}`} role="status">{notice.text}</p>}
      {orders.length === 0 ? (
        <p className="page-status">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr><th>Mã</th><th>Khách hàng</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th /></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    {o.customer}
                    <small className="admin-sub">{o.phone} · {o.address}</small>
                  </td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><span className={`admin-status admin-status--${o.status}`}>{ORDER_STATUS[o.status] ?? o.status}</span></td>
                  <td className="admin-actions">
                    {NEXT_STATUS[o.status] && (
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => advance(o)}>
                        → {ORDER_STATUS[NEXT_STATUS[o.status]]}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MessagesTab() {
  const [messages, setMessages] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    contactApi.list().then(setMessages).catch((e) => setNotice({ type: 'error', text: e.message }));
  }, []);
  useEffect(load, [load]);

  // DELETE /api/contact/{id}
  async function handleDelete(m) {
    if (!window.confirm(`Xóa lời nhắn của ${m.name}?`)) return;
    try {
      await contactApi.remove(m.id);
      setNotice({ type: 'success', text: 'Đã xóa lời nhắn.' });
      load();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  if (!messages) return <p className="page-status">{notice.text || 'Đang tải…'}</p>;
  return (
    <>
      {notice.text && <p className={`alert alert--${notice.type}`} role="status">{notice.text}</p>}
      {messages.length === 0 ? (
        <p className="page-status">Chưa có lời nhắn nào.</p>
      ) : (
        <ul className="admin-messages">
          {messages.map((m) => (
            <li key={m.id} className="admin-message">
              <div className="admin-message__head">
                <strong>{m.name}</strong>
                <a href={`mailto:${encodeURIComponent(m.email)}`}>{m.email}</a>
                <small>{formatDate(m.createdAt)}</small>
              </div>
              {/* Nội dung do khách nhập: hiển thị qua JSX nên React tự escape, không chạy được script (§2.1) */}
              <p>{m.message}</p>
              <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDelete(m)}>Xóa</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('products');
  return (
    <div className="page">
      <section className="page-hero page-hero--compact">
        <div className="container">
          <p className="eyebrow">Quản trị</p>
          <h1>Quản lý cửa hàng</h1>
          <div className="admin-tabs" role="tablist" aria-label="Khu vực quản trị">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
                className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {tab === 'products' && <ProductsTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'messages' && <MessagesTab />}
        </div>
      </section>
    </div>
  );
}
