import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { orderApi } from '../api/services.js';
import { formatDate, formatPrice, ORDER_STATUS } from '../utils/format.js';
import NotFound from './NotFound.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!/^[1-9][0-9]{0,9}$/.test(id ?? '')) {
      setStatus('notfound');
      return;
    }
    // Máy chủ chỉ trả đơn hàng thuộc về người dùng đang đăng nhập (chống IDOR)
    orderApi.get(id)
      .then((d) => {
        setData(d);
        setStatus('ok');
      })
      .catch((e) => setStatus(e.status === 404 ? 'notfound' : 'error'));
  }, [id]);

  if (status === 'loading') return <p className="container page-status">Đang tải…</p>;
  if (status === 'notfound') return <NotFound />;
  if (status === 'error') return <p className="container alert alert--error">Không tải được đơn hàng.</p>;

  const { order, items } = data;

  // DELETE /api/orders/{id}: hủy đơn khi còn "Chờ xác nhận"; máy chủ kiểm tra lại quyền và trạng thái
  async function handleCancel() {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await orderApi.cancel(order.id);
      setData(await orderApi.get(order.id));
      setMessage({ type: 'success', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="page">
      <div className="container section">
        {location.state?.justOrdered && (
          <p className="alert alert--success">Đặt hàng thành công! Chúng tôi sẽ gọi xác nhận trong ít phút.</p>
        )}
        <Link to="/tai-khoan" className="link-arrow">
          ← Về tài khoản
        </Link>
        <div className="order-head">
          <h1>Đơn hàng #{order.id}</h1>
          {order.status === 'pending' && (
            <button type="button" className="btn btn--ghost" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Đang hủy…' : 'Hủy đơn hàng'}
            </button>
          )}
        </div>
        {message.text && <p className={`alert alert--${message.type}`} role="status">{message.text}</p>}
        <dl className="order-meta">
          <div>
            <dt>Ngày đặt</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{ORDER_STATUS[order.status] ?? order.status}</dd>
          </div>
          <div>
            <dt>Điện thoại</dt>
            <dd>{order.phone}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{order.address}</dd>
          </div>
          {order.note && (
            <div>
              <dt>Ghi chú</dt>
              <dd>{order.note}</dd>
            </div>
          )}
        </dl>
        <table className="table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
              <th>SL</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.slug}>
                <td>
                  <Link to={`/san-pham/${it.slug}`}>{it.name}</Link>
                </td>
                <td>{formatPrice(it.unitPrice)}</td>
                <td>{it.quantity}</td>
                <td>{formatPrice(it.unitPrice * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Tổng cộng</td>
              <td>
                <strong>{formatPrice(order.total)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
