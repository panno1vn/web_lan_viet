import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import OrchidArt from '../components/OrchidArt.jsx';
import GardenHero from '../components/GardenHero.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/client.js';
import '../styles/home.css';

const PROMISES = [
  { title: 'Giao nhanh 2 giờ', text: 'Nội thành Hà Nội, TP.HCM, Đà Lạt' },
  { title: 'Bảo hành 7 ngày', text: 'Đổi cây mới nếu hoa héo, rụng nụ' },
  { title: 'Tư vấn trọn đời', text: 'Hướng dẫn chăm sóc miễn phí' },
  { title: 'Tuyển chọn từ vườn', text: 'Chăm chút từng cành, từng nụ' },
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
      <GardenHero />

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
            <Link to="/about-us#lien-he" className="btn btn--ghost">
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

      {/* CTA */}
      <section className="cta">
        <div className="container cta__inner">
          <div>
            <h2>Cần lan cho sự kiện, văn phòng?</h2>
            <p>Nhận báo giá sỉ và thiết kế chậu lan theo yêu cầu trong 24 giờ.</p>
          </div>
          <Link to="/about-us#lien-he" className="btn btn--light btn--lg">
            Liên hệ báo giá
          </Link>
        </div>
      </section>
    </div>
  );
}
