import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import OrchidArt from './OrchidArt.jsx';

const slides = [
  { label: 'Một chút thiên nhiên, một chút yêu thương', title: 'Để mỗi ngày', highlight: 'đều nở hoa.', text: 'Mang vẻ đẹp dịu dàng của vườn lan về không gian sống. Từng chậu hoa được nâng niu, từ vườn đến tay bạn.', color: '#dd97b8' },
  { label: 'Gửi lời thương bằng một chậu lan', title: 'Món quà nhỏ,', highlight: 'niềm vui lớn.', text: 'Một lời cảm ơn, một dịp đặc biệt hay đơn giản là dành tặng chính mình. Luôn có một chậu lan dành cho bạn.', color: '#f4dce8' },
];

export default function GardenHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [paused]);
  const slide = slides[active];
  return (
    <section className={`garden-hero garden-hero--${active}`} aria-label="Cảm hứng từ vườn lan" aria-roledescription="trình chiếu">
      <div className="container garden-hero__layout">
        <div className="garden-hero__copy" key={active}>
          <p className="eyebrow">LAN VIỆT GARDEN · ĐÀ LẠT</p>
          <p className="garden-hero__caption">{slide.label}</p>
          <h1>{slide.title}<br /><span>{slide.highlight}</span></h1>
          <p className="garden-hero__lead">{slide.text}</p>
          <div className="hero__actions">
            <Link to="/san-pham" className="btn btn--primary btn--lg">Khám phá vườn lan <span aria-hidden="true">↗</span></Link>
            <Link to="/about-us" className="garden-hero__story">Câu chuyện của vườn →</Link>
          </div>
        </div>
        <div className="garden-hero__visual" aria-hidden="true">
          <div className="garden-hero__halo" />
          <span className="garden-hero__outline">bloom</span>
          <div className="garden-hero__plant" key={slide.color}>
            <OrchidArt className="garden-flower garden-flower--one" color={slide.color} accent="#ead79b" size={280} stem />
            <OrchidArt className="garden-flower garden-flower--two" color="#f8eaf1" accent="#dba3bf" size={190} stem />
            <OrchidArt className="garden-flower garden-flower--three" color="#c877a1" accent="#ead79b" size={160} stem />
            <div className="garden-hero__pot" />
          </div>
          <span className="garden-hero__seal">Ươm từ tâm<br /><b>Nở thành yêu</b><span>✳</span></span>
          <span className="garden-hero__note">Một góc vườn, dành riêng cho bạn.</span>
        </div>
      </div>
      <div className="container garden-hero__bottom">
        <span>CHỌN MỘT CHẬU LAN. GỬI NGÀN LỜI THƯƠNG.</span>
        <div className="slide-controls" aria-label="Điều khiển trình chiếu">
          {slides.map((item, index) => <button key={item.title} type="button" aria-label={`Trang ${index + 1}: ${item.title} ${item.highlight}`} aria-pressed={active === index} onClick={() => setActive(index)}>{String(index + 1).padStart(2, '0')}</button>)}
          <button type="button" aria-label={paused ? 'Tiếp tục trình chiếu' : 'Tạm dừng trình chiếu'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? '▶' : 'Ⅱ'}</button>
        </div>
      </div>
    </section>
  );
}
