import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import OrchidArt from '../components/OrchidArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/client.js';
import '../styles/home.css';

const PROMISES = [
  { title: 'Giao nhanh 2 giờ', text: 'Nội thành Hà Nội, TP.HCM, Đà Lạt' },
  { title: 'Bảo hành 7 ngày', text: 'Đổi cây mới nếu hoa héo, rụng nụ' },
  { title: 'Tư vấn trọn đời', text: 'Hướng dẫn chăm sóc miễn phí' },
  { title: 'Thanh toán an toàn', text: 'Kết nối mã hóa HTTPS' },
];

const COLLECTIONS = [
  { name: 'Hồ điệp', desc: 'Sang trọng, bền hoa 2–3 tháng', color: '#d77fb5', accent: '#f2c94c' },
  { name: 'Dendrobium', desc: 'Dễ chăm, hợp người mới', color: '#e48fb4', accent: '#fff1a8' },
  { name: 'Cattleya', desc: 'Nữ hoàng các loài lan', color: '#9b1d3a', accent: '#f4c430' },
  { name: 'Vanda', desc: 'Rễ khí sinh độc đáo', color: '#5a6fd6', accent: '#ffffff' },
];

const STEPS = [
  { n: '01', title: 'Ánh sáng', text: 'Đặt lan nơi có ánh sáng tán xạ, tránh nắng gắt buổi trưa chiếu trực tiếp.' },
  { n: '02', title: 'Tưới nước', text: 'Tưới khi giá thể khô mặt, khoảng 1–2 lần mỗi tuần, tránh đọng nước ở nách lá.' },
  { n: '03', title: 'Dinh dưỡng', text: 'Bón phân NPK loãng mỗi tuần một lần trong mùa sinh trưởng.' },
];

const REVIEWS = [
  { name: 'Chị Minh Thư', place: 'Hà Nội', text: 'Chậu hồ điệp tặng mẹ dịp Tết nở bền gần 3 tháng. Đóng gói rất cẩn thận.' },
  { name: 'Anh Quốc Bảo', place: 'TP.HCM', text: 'Được tư vấn kỹ cách chăm dendro, giờ cây đã ra lứa hoa thứ hai.' },
  { name: 'Cô Thanh Hà', place: 'Đà Lạt', text: 'Lan hài ở vườn rất khỏe, đúng mô tả. Sẽ tiếp tục ủng hộ.' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api('/products?featured=1')
      .then((d) => alive && setFeatured(d.products))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            <p className="eyebrow">Vườn lan Đà Lạt · Từ 2012</p>
            <h1>
              Vẻ đẹp tinh khôi của <span>hoa lan Việt</span>
            </h1>
            <p className="hero__lead">
              Hơn 40 giống lan được ươm trồng tại vườn, tuyển chọn từng chậu và giao tận tay bạn trong ngày.
              Món quà sang trọng cho tân gia, khai trương và ngày Tết.
            </p>
            <div className="hero__actions">
              <Link to="/san-pham" className="btn btn--primary btn--lg">
                Mua lan ngay
              </Link>
              <Link to="/about-us" className="btn btn--ghost btn--lg">
                Về vườn lan
              </Link>
            </div>
            <dl className="hero__stats">
              <div>
                <dt>12+</dt>
                <dd>năm kinh nghiệm</dd>
              </div>
              <div>
                <dt>40+</dt>
                <dd>giống lan</dd>
              </div>
              <div>
                <dt>15k</dt>
                <dd>khách hàng</dd>
              </div>
            </dl>
          </div>
          <div className="hero__art" aria-hidden="true">
            <div className="hero__circle" />
            <OrchidArt className="hero__flower hero__flower--1" color="#c2569b" accent="#f2c94c" size={200} stem />
            <OrchidArt className="hero__flower hero__flower--2" color="#f7f3f8" accent="#e8c547" size={150} stem />
            <OrchidArt className="hero__flower hero__flower--3" color="#8e3c9e" accent="#f2d16b" size={120} stem />
          </div>
        </div>
      </section>

      {/* CAM KẾT */}
      <section className="promises">
        <ul className="container promises__list">
          {PROMISES.map((p) => (
            <li key={p.title} className="promise">
              <span className="promise__dot" aria-hidden="true" />
              <div>
                <strong>{p.title}</strong>
                <p>{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="eyebrow">Được yêu thích</p>
              <h2>Lan bán chạy tuần này</h2>
            </div>
            <Link to="/san-pham" className="link-arrow">
              Xem tất cả →
            </Link>
          </div>
          {error && <p className="alert alert--error">{error}</p>}
          <div className="grid grid--products">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* BỘ SƯU TẬP */}
      <section className="section section--tint">
        <div className="container">
          <div className="section__head section__head--center">
            <p className="eyebrow">Bộ sưu tập</p>
            <h2>Chọn lan theo dòng</h2>
          </div>
          <div className="collections">
            {COLLECTIONS.map((c) => (
              <Link key={c.name} to={`/san-pham?q=${encodeURIComponent(c.name)}`} className="collection">
                <OrchidArt color={c.color} accent={c.accent} size={90} />
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HƯỚNG DẪN CHĂM SÓC */}
      <section className="section">
        <div className="container care">
          <div className="care__intro">
            <p className="eyebrow">Cẩm nang</p>
            <h2>Chăm lan chỉ với 3 bước</h2>
            <p>
              Lan không khó tính như bạn nghĩ. Chỉ cần nắm 3 nguyên tắc cơ bản, chậu lan của bạn sẽ khỏe mạnh và
              ra hoa đều đặn mỗi năm.
            </p>
            <Link to="/lien-he" className="btn btn--ghost">
              Hỏi chuyên gia
            </Link>
          </div>
          <ol className="care__steps">
            {STEPS.map((s) => (
              <li key={s.n} className="step">
                <span className="step__n">{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CẢM NHẬN */}
      <section className="section section--tint">
        <div className="container">
          <div className="section__head section__head--center">
            <p className="eyebrow">Khách hàng nói gì</p>
            <h2>Niềm vui nở hoa</h2>
          </div>
          <div className="reviews">
            {REVIEWS.map((r) => (
              <figure key={r.name} className="review">
                <blockquote>“{r.text}”</blockquote>
                <figcaption>
                  <strong>{r.name}</strong> · {r.place}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta__inner">
          <div>
            <h2>Cần lan cho sự kiện, văn phòng?</h2>
            <p>Nhận báo giá sỉ và thiết kế chậu lan theo yêu cầu trong 24 giờ.</p>
          </div>
          <Link to="/lien-he" className="btn btn--light btn--lg">
            Liên hệ báo giá
          </Link>
        </div>
      </section>
    </div>
  );
}
