import { Link } from 'react-router';
import Contact from './Contact.jsx';
import '../styles/about.css';

const TIMELINE = [
  { year: '2012', title: 'Một khu vườn nhỏ', text: 'Khởi đầu với 200 chậu hồ điệp và niềm đam mê của một gia đình làm vườn ở Đà Lạt.' },
  { year: '2016', title: 'Ươm thêm những ước mơ', text: 'Mở rộng nhà kính 3.000 m², bắt đầu nhân giống cấy mô để tiếp nối những mùa hoa.' },
  { year: '2020', title: 'Vườn gần hơn với bạn', text: 'Ra mắt cửa hàng trực tuyến, đưa những chậu lan đến với người yêu hoa tại 20 tỉnh thành.' },
  { year: '2025', title: 'Niềm tin cùng lớn lên', text: '15.000 khách hàng thân thiết, hơn 40 giống lan và một tình yêu hoa vẫn vẹn nguyên.' },
];

const VALUES = [
  { icon: '♡', title: 'Chăm bằng sự tận tâm', text: 'Từ lúc ươm trồng đến khi trao tay, mỗi chậu lan đều được chăm chút và tuyển chọn kỹ lưỡng.' },
  { icon: '✧', title: 'Đẹp từ sự chân thành', text: 'Giá niêm yết rõ ràng, thông tin đúng giống và đúng tình trạng cây để bạn an tâm lựa chọn.' },
  { icon: '❋', title: 'Gần hơn với tự nhiên', text: 'Sử dụng giá thể tái chế, hạn chế hóa chất và lựa chọn bao bì thân thiện với môi trường.' },
];

export default function AboutUs() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero__layout">
          <div className="about-hero__copy">
            <p className="eyebrow">CÂU CHUYỆN CỦA LAN VIỆT GARDEN</p>
            <h1>Từ một khu vườn nhỏ,<br />gửi đến bạn <span>một mùa hoa.</span></h1>
            <p>Có những niềm vui bắt đầu rất giản dị. Với chúng tôi, đó là khoảnh khắc một nụ lan hé nở trong khu vườn gia đình ở Đà Lạt.</p>
            <a className="about-story-link" href="#cau-chuyen">Đi cùng câu chuyện của vườn <span aria-hidden="true">↓</span></a>
          </div>
          <div className="about-hero__collage">
            <span className="about-orbit" aria-hidden="true" />
            <figure className="about-photo about-photo--main">
              <img src="/images/orchids/white.jpg" alt="Cánh hồ điệp trắng với nhụy vàng dịu nhẹ" width="750" height="1000" fetchPriority="high" />
              <figcaption>Vẻ đẹp bắt đầu từ những điều nhỏ bé.</figcaption>
            </figure>
            <figure className="about-photo about-photo--small">
              <img src="/images/orchids/purple.jpg" alt="Những bông hồ điệp tím giữa tán lá xanh" width="600" height="750" />
            </figure>
            <div className="about-stamp"><span>ĐÀ LẠT</span><b>2012</b><span>ƯƠM TỪ TÂM</span></div>
            <span className="about-spark" aria-hidden="true">✳</span>
          </div>
        </div>
        <div className="container about-facts">
          <div><strong>Từ 2012</strong><span>Bén rễ ở Đà Lạt</span></div>
          <div><strong>40+</strong><span>Giống lan được nuôi dưỡng</span></div>
          <div><strong>15.000</strong><span>Khách hàng thân thiết</span></div>
          <p>Mỗi chậu lan là một lời thương<br />được gửi đi từ vườn.</p>
        </div>
      </section>

      <section id="cau-chuyen" className="section about-story" data-reveal>
        <div className="container about-story__layout">
          <div className="about-story__label"><span className="about-chapter">01 / GỐC RỄ</span><h2>Không chỉ trồng hoa.<br />Chúng tôi nuôi dưỡng <em>niềm vui.</em></h2></div>
          <div className="about-story__text">
            <p className="about-intro">Lan Việt Garden bắt đầu từ tình yêu dành cho hoa lan của một gia đình ở Đà Lạt — nơi từng chậu cây được chăm bằng sự kiên nhẫn và niềm háo hức chờ hoa nở.</p>
            <p>Chúng tôi tin một chậu lan đẹp có thể làm bừng sáng cả không gian sống. Vì thế, vườn tự ươm trồng, tuyển chọn từng chậu và hướng dẫn chăm sóc tận tình, để vẻ đẹp ấy tiếp tục ở lại trong ngôi nhà bạn.</p>
            <p>Dù đó là món quà gửi người thương hay một góc xanh dành cho chính mình, chúng tôi mong bạn tìm được chậu lan khiến mình mỉm cười.</p>
            <div className="about-signature">Lan Việt Garden <span>Ươm từ tâm · Nở thành yêu</span></div>
          </div>
        </div>
      </section>

      <section className="about-values" data-reveal>
        <div className="container">
          <div className="about-section-heading"><span className="about-chapter">02 / ĐIỀU VƯỜN GÌN GIỮ</span><h2>Hoa đẹp từ gốc.<br />Niềm tin đẹp từ <em>sự chân thành.</em></h2></div>
          <div className="about-values__grid">
            {VALUES.map((value, index) => <article className="about-value" key={value.title}><div className="about-value__top"><span aria-hidden="true">{value.icon}</span><small>0{index + 1}</small></div><h3>{value.title}</h3><p>{value.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section about-journey" data-reveal>
        <div className="container">
          <div className="about-journey__heading"><div><span className="about-chapter">03 / NHỮNG MÙA HOA ĐÃ QUA</span><h2>Lớn lên cùng <em>tình yêu lan.</em></h2></div><p>Từ những chậu hoa đầu tiên đến hành trình mang một góc thiên nhiên vào mỗi ngôi nhà.</p></div>
          <ol className="about-timeline">{TIMELINE.map(item => <li key={item.year}><span className="about-timeline__year">{item.year}</span><span className="about-timeline__dot" aria-hidden="true" /><h3>{item.title}</h3><p>{item.text}</p></li>)}</ol>
        </div>
      </section>

      <section className="about-companion" data-reveal>
        <div className="container about-companion__layout">
          <div className="about-companion__image"><img src="/images/orchids/pink.jpg" alt="Chùm Dendrobium hồng nở rộ" width="675" height="900" loading="lazy" /><span>Chăm một chậu lan,<br /><b>thêm một niềm vui.</b></span></div>
          <div className="about-companion__copy"><span className="about-chapter">04 / TỪ VƯỜN ĐẾN NHÀ</span><h2>Hoa đến tay bạn.<br />Sự đồng hành <em>vẫn ở lại.</em></h2><p>Một chậu lan rời vườn là khởi đầu của một câu chuyện mới. Đội ngũ kỹ sư nông nghiệp luôn sẵn sàng tư vấn miễn phí trong suốt quá trình bạn chăm cây.</p><ul><li><span aria-hidden="true">01</span>Chọn giống lan phù hợp với không gian sống.</li><li><span aria-hidden="true">02</span>Hiểu ánh sáng, nước tưới và dinh dưỡng của cây.</li><li><span aria-hidden="true">03</span>Cùng chăm để cây khỏe và đón những mùa hoa mới.</li></ul><Link to="/about-us#lien-he" className="btn btn--ghost">Trò chuyện cùng vườn ↗</Link></div>
        </div>
      </section>

      <section className="section about-visit" data-reveal>
        <div className="container about-visit__inner"><span className="about-visit__flower" aria-hidden="true">✳</span><p className="eyebrow">HẸN BẠN MỘT NGÀY Ở VƯỜN</p><h2>Chậm lại một chút.<br /><span>Để thiên nhiên đến gần hơn.</span></h2><p>Ghé thăm, ngắm hoa và tìm một chậu lan dành riêng cho bạn.<br />Vườn đón khách mỗi ngày, từ 7:00 đến 20:00.</p><div><Link to="/about-us#lien-he" className="btn btn--primary btn--lg">Hẹn gặp tại vườn ↗</Link><Link to="/san-pham" className="about-visit__shop">Khám phá những chậu lan →</Link></div></div>
        <p className="container about-photo-note">Ảnh hoa lan mang tính tham khảo, không phải ảnh chụp cơ sở của vườn. Nguồn và tác giả được ghi tại cuối trang.</p>
      </section>
      <Contact />
    </div>
  );
}
