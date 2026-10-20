import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import OrchidArt from '../components/OrchidArt.jsx';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';
import NotFound from './NotFound.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { add, MAX_QTY } = useCart();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    // Kiểm tra định dạng slug trước khi gọi API (máy chủ cũng kiểm tra lại)
    if (!/^[a-z0-9-]{1,80}$/.test(slug ?? '')) {
      setStatus('notfound');
      return undefined;
    }
    api(`/products/${slug}`)
      .then((d) => {
        if (!alive) return;
        setProduct(d.product);
        setStatus('ok');
      })
      .catch((e) => alive && setStatus(e.status === 404 ? 'notfound' : 'error'));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (status === 'loading') return <p className="container page-status">Đang tải…</p>;
  if (status === 'notfound') return <NotFound />;
  if (status === 'error') return <p className="container alert alert--error">Không tải được sản phẩm.</p>;

  const max = Math.min(product.stock, MAX_QTY);

  function handleAdd() {
    add(product.id, qty);
    setAdded(true);
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link> / <Link to="/san-pham">Sản phẩm</Link> / <span>{product.name}</span>
        </nav>
        <div className="detail">
          <div className="detail__media">
            <OrchidArt color={product.color} accent={product.accent} size={240} stem />
          </div>
          <div className="detail__info">
            <p className="eyebrow">{product.species}</p>
            <h1>{product.name}</h1>
            <p className="detail__price">{formatPrice(product.price)}</p>
            <p>{product.description}</p>
            <div className="detail__care">
              <h2>Cách chăm sóc</h2>
              <p>{product.care}</p>
            </div>
            <p className={product.stock > 0 ? 'stock stock--ok' : 'stock stock--out'}>
              {product.stock > 0 ? `Còn ${product.stock} chậu` : 'Tạm hết hàng'}
            </p>
            {product.stock > 0 && (
              <div className="detail__buy">
                <label htmlFor="qty">Số lượng</label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={max}
                  value={qty}
                  onChange={(e) => setQty(Math.min(Math.max(Number(e.target.value) || 1, 1), max))}
                />
                <button type="button" className="btn btn--primary btn--lg" onClick={handleAdd}>
                  Thêm vào giỏ
                </button>
              </div>
            )}
            {added && (
              <p className="alert alert--success">
                Đã thêm vào giỏ. <Link to="/gio-hang">Xem giỏ hàng →</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
