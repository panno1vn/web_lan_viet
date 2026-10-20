import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { api } from '../api/client.js';
import { formatDate, formatPrice, ORDER_STATUS } from '../utils/format.js';
import NotFound from './NotFound.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!/^[1-9][0-9]{0,9}$/.test(id ?? '')) {
      setStatus('notfound');
      return;
    }
    // Máy chủ chỉ trả đơn hàng thuộc về người dùng đang đăng nhập (chống IDOR)
    api(`/orders/${id}`)
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
  return (
    <div className="page">
      <div className="container section">
        {location.state?.justOrdered && (
          <p className="alert alert--success">Đặt hàng thành công! Chúng tôi sẽ gọi xác nhận trong ít phút.</p>
        )}
        <Link to="/tai-khoan" className="link-arrow">
          ← Về tài khoản
        </Link>
        <h1>Đơn hàng #{order.id}</h1>
        <dl className="order-meta">
          <div>
            <dt>Ngày đặt</dt>
            <dd>{formatDate(order.created_at)}</dd>
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
                <td>{formatPrice(it.unit_price)}</td>
                <td>{it.quantity}</td>
                <td>{formatPrice(it.unit_price * it.quantity)}</td>
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
