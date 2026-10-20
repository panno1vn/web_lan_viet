import { useState } from 'react';
import { Link } from 'react-router';
import ProductImage from './ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function ProductCard({ product, detailed = false }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === 0;

  function handleAdd() {
    add(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="card">
      <Link to={`/san-pham/${product.slug}`} className="card__media">
        <ProductImage product={product} />
        {product.featured === 1 && <span className="card__tag">Bán chạy</span>}
        {detailed && <span className="card__view">Xem chi tiết ↗</span>}
      </Link>
      <div className="card__body">
        <p className="card__species">{product.species}</p>
        <h3 className="card__title">
          <Link to={`/san-pham/${product.slug}`}>{product.name}</Link>
        </h3>
        {detailed && <p className="card__description">{product.description}</p>}
        {detailed && <p className={`card__availability ${outOfStock ? 'card__availability--out' : ''}`}>{outOfStock ? 'Tạm hết hàng' : `Còn ${product.stock} chậu tại vườn`}</p>}
        <p className="card__price">{formatPrice(product.price)}</p>
        <button type="button" className="btn btn--primary btn--block" onClick={handleAdd} disabled={outOfStock}>
          {outOfStock ? 'Hết hàng' : added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
        </button>
      </div>
    </article>
  );
}
