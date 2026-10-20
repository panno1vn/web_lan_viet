import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/client.js';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').slice(0, 60);
  const [term, setTerm] = useState(q);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    // Từ khóa được mã hóa URL; máy chủ dùng truy vấn tham số hóa nên không thể chèn SQL
    api(`/products?q=${encodeURIComponent(q)}`)
      .then((d) => alive && setProducts(d.products))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q]);

  function handleSubmit(e) {
    e.preventDefault();
    const value = term.trim().slice(0, 60);
    setParams(value ? { q: value } : {});
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--compact">
        <div className="container">
          <p className="eyebrow">Cửa hàng</p>
          <h1>Tất cả sản phẩm</h1>
          <form className="search" role="search" onSubmit={handleSubmit}>
            <label htmlFor="search" className="sr-only">
              Tìm kiếm hoa lan
            </label>
            <input
              id="search"
              type="search"
              placeholder="Tìm theo tên hoặc dòng lan…"
              value={term}
              maxLength={60}
              onChange={(e) => setTerm(e.target.value)}
            />
            <button type="submit" className="btn btn--primary">
              Tìm
            </button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Từ khóa hiển thị qua JSX nên được React tự động escape - không bị Reflected XSS (§2.1) */}
          {q && (
            <p className="result-note">
              Kết quả cho “<strong>{q}</strong>”: {loading ? '…' : `${products.length} sản phẩm`}
            </p>
          )}
          {error && <p className="alert alert--error">{error}</p>}
          {loading ? (
            <p className="page-status">Đang tải…</p>
          ) : products.length === 0 ? (
            <p className="page-status">Không tìm thấy sản phẩm phù hợp.</p>
          ) : (
            <div className="grid grid--products">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
