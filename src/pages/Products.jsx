import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/client.js';
import '../styles/catalog.css';

const SPECIES = ['Hồ điệp', 'Dendrobium', 'Cattleya', 'Vanda', 'Mokara', 'Lan hài', 'Oncidium'];
const PRICES = [
  { value: '', label: 'Tất cả mức giá' },
  { value: 'under500', label: 'Dưới 500.000 ₫' },
  { value: '500to1000', label: '500.000 – 1.000.000 ₫' },
  { value: 'over1000', label: 'Trên 1.000.000 ₫' },
];
const SORTS = [
  { value: 'featured', label: 'Được yêu thích' },
  { value: 'price-asc', label: 'Giá: thấp đến cao' },
  { value: 'price-desc', label: 'Giá: cao đến thấp' },
  { value: 'name', label: 'Tên: A → Z' },
];
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').slice(0, 60);
  const category = SPECIES.includes(params.get('category')) ? params.get('category') : '';
  const price = PRICES.some(item => item.value === params.get('price')) ? params.get('price') : '';
  const sort = SORTS.some(item => item.value === params.get('sort')) ? params.get('sort') : 'featured';
  const inStock = params.get('stock') === '1';
  const [term, setTerm] = useState(q);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => setTerm(q), [q]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api('/products')
      .then(data => { if (alive) setProducts(data.products); })
      .catch(err => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [retry]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { preventScrollReset: true });
  }

  const results = useMemo(() => {
    const matches = products.filter(product => {
      if (q && !normalize(`${product.name} ${product.species}`).includes(normalize(q.trim()))) return false;
      if (category && product.species !== category) return false;
      if (inStock && product.stock <= 0) return false;
      if (price === 'under500' && product.price >= 500000) return false;
      if (price === '500to1000' && (product.price < 500000 || product.price > 1000000)) return false;
      if (price === 'over1000' && product.price <= 1000000) return false;
      return true;
    });
    return matches.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'name') return a.name.localeCompare(b.name, 'vi');
      return b.featured - a.featured || a.id - b.id;
    });
  }, [products, q, category, price, inStock, sort]);
  const activeFilters = [q && { key: 'q', label: `Tìm: ${q}` }, category && { key: 'category', label: category }, price && { key: 'price', label: PRICES.find(item => item.value === price).label }, inStock && { key: 'stock', label: 'Còn hàng' }].filter(Boolean);

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="container catalog-hero__layout">
          <div className="catalog-hero__copy">
            <p className="eyebrow">MỘT GÓC VƯỜN DÀNH CHO BẠN</p>
            <h1>Chọn một chậu lan,<br /><span>đón một niềm vui.</span></h1>
            <p>Từ sắc trắng tinh khôi đến những gam màu rực rỡ. Tìm chậu lan hợp với không gian, một dịp đặc biệt, hay đơn giản là tâm trạng hôm nay.</p>
            <a href="#bo-suu-tap" className="catalog-explore">Dạo một vòng vườn <span aria-hidden="true">↓</span></a>
          </div>
          <div className="catalog-hero__art" aria-hidden="true">
            <img className="catalog-hero__photo catalog-hero__photo--back" src="/images/orchids/white.jpg" alt="" width="300" height="380" />
            <img className="catalog-hero__photo catalog-hero__photo--front" src="/images/orchids/purple.jpg" alt="" width="300" height="380" />
            <span className="catalog-hero__flower">✳</span>
            <span className="catalog-hero__note">Một chút hoa, một chút thương.</span>
          </div>
        </div>
      </section>

      <div className="container catalog-benefits"><span>✧ Tuyển chọn từ vườn</span><span>♡ Tư vấn chăm sóc miễn phí</span><span>❋ Đa dạng dòng lan</span></div>

      <section id="bo-suu-tap" className="container catalog-shop" aria-labelledby="catalog-heading">
        <div className="catalog-shop__heading"><div><p className="eyebrow">KHÁM PHÁ BỘ SƯU TẬP</p><h2 id="catalog-heading">Sắc hoa bạn yêu</h2></div><p>Mỗi dòng lan, một nét duyên riêng.</p></div>
        <div className="catalog-shop__layout">
          <aside className="catalog-filters" aria-label="Bộ lọc sản phẩm">
            <div className="catalog-filters__heading"><h3>Chọn theo ý bạn</h3>{activeFilters.length > 0 && <button type="button" onClick={() => setParams({})}>Xóa bộ lọc</button>}</div>
            <fieldset className="catalog-categories"><legend>Dòng lan</legend><button type="button" className={!category ? 'is-selected' : ''} aria-pressed={!category} onClick={() => updateFilter('category', '')}><span>Tất cả hoa lan</span><small>{loading ? '…' : products.length}</small></button>{SPECIES.map(species => <button key={species} type="button" className={category === species ? 'is-selected' : ''} aria-pressed={category === species} onClick={() => updateFilter('category', species)}><span>{species}</span><small>{loading ? '…' : products.filter(product => product.species === species).length}</small></button>)}</fieldset>
            <fieldset className="catalog-prices"><legend>Khoảng giá</legend>{PRICES.map(item => <label key={item.value}><input type="radio" name="price" value={item.value} checked={price === item.value} onChange={() => updateFilter('price', item.value)} /><span>{item.label}</span></label>)}</fieldset>
            <label className="catalog-stock"><input type="checkbox" checked={inStock} onChange={() => updateFilter('stock', inStock ? '' : '1')} />Chỉ hiện sản phẩm còn hàng</label>
            <div className="catalog-help"><span aria-hidden="true">♡</span><h3>Chưa biết chọn lan nào?</h3><p>Kể vườn nghe về không gian và sở thích của bạn nhé.</p><Link to="/about-us#lien-he">Nhờ vườn tư vấn ↗</Link></div>
          </aside>

          <div className="catalog-results">
            <form className="catalog-search" role="search" onSubmit={event => { event.preventDefault(); updateFilter('q', term.trim().slice(0, 60)); }}><label className="sr-only" htmlFor="catalog-search">Tìm kiếm hoa lan</label><input id="catalog-search" type="search" value={term} onChange={event => setTerm(event.target.value)} maxLength={60} placeholder="Bạn đang tìm chậu lan nào?" /><button className="btn btn--primary" type="submit">Tìm kiếm</button></form>
            <div className="catalog-toolbar"><p role="status">{loading ? 'Đang ghé thăm vườn…' : error ? 'Chưa tải được sản phẩm' : <><strong>{results.length}</strong> sản phẩm {category ? `· ${category}` : 'trong bộ sưu tập'}</>}</p><label>Sắp xếp<select aria-label="Sắp xếp sản phẩm" value={sort} onChange={event => updateFilter('sort', event.target.value)}>{SORTS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
            {activeFilters.length > 0 && <div className="catalog-active" aria-label="Bộ lọc đang áp dụng">{activeFilters.map(filter => <button key={filter.key} type="button" onClick={() => updateFilter(filter.key, '')} aria-label={`Bỏ bộ lọc ${filter.label}`}>{filter.label}<span aria-hidden="true">×</span></button>)}</div>}
            {error ? <div className="catalog-empty" role="alert"><h3>Chưa kết nối được với vườn</h3><p>{error}</p><button className="btn btn--ghost" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div> : loading ? <><p className="sr-only" role="status">Đang tải sản phẩm</p><div className="catalog-grid" aria-hidden="true">{Array.from({length:6},(_,index)=><div className="catalog-skeleton" key={index}><div /><span /><span /></div>)}</div></> : results.length === 0 ? <div className="catalog-empty"><span aria-hidden="true">❋</span><h3>Chưa tìm thấy chậu lan phù hợp</h3><p>Thử một từ khóa khác hoặc bỏ bớt bộ lọc để khám phá thêm nhé.</p><button className="btn btn--primary" type="button" onClick={() => setParams({})}>Xem tất cả hoa lan</button></div> : <div className="catalog-grid">{results.map(product => <ProductCard key={product.id} product={product} detailed />)}</div>}
          </div>
        </div>
      </section>
      <section className="container catalog-ending"><span aria-hidden="true">✳</span><div><h2>Mang một góc thiên nhiên về nhà.</h2><p>Vườn luôn ở đây để đồng hành cùng bạn, từ chọn hoa đến chăm cây.</p></div><Link to="/about-us" className="btn btn--ghost">Câu chuyện của vườn ↗</Link></section>
    </div>
  );
}
