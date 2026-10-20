import { useState } from 'react';
import { Link } from 'react-router';
import OrchidArt from './OrchidArt.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function ProductCard({ product }) {
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
        <OrchidArt color={product.color} accent={product.accent} size={130} stem />
        {product.featured === 1 && <span className="card__tag">Bán chạy</span>}
      </Link>
      <div className="card__body">
        <p className="card__species">{product.species}</p>
        <h3 className="card__title">
          <Link to={`/san-pham/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="card__price">{formatPrice(product.price)}</p>
        <button type="button" className="btn btn--primary btn--block" onClick={handleAdd} disabled={outOfStock}>
          {outOfStock ? 'Hết hàng' : added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
        </button>
      </div>
    </article>
  );
}
