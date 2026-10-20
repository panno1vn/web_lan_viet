import { Link } from 'react-router';
import OrchidArt from '../components/OrchidArt.jsx';

const TIMELINE = [
  { year: '2012', text: 'Khởi đầu với 200 chậu hồ điệp trong khu vườn nhỏ ở Đà Lạt.' },
  { year: '2016', text: 'Mở rộng nhà kính 3.000 m², bắt đầu nhân giống cấy mô.' },
  { year: '2020', text: 'Ra mắt cửa hàng trực tuyến, giao lan đến 20 tỉnh thành.' },
  { year: '2025', text: 'Đạt 15.000 khách hàng thân thiết và hơn 40 giống lan.' },
];

const VALUES = [
  { title: 'Tận tâm', text: 'Mỗi chậu lan được chăm như chăm người thân trước khi đến tay bạn.' },
  { title: 'Minh bạch', text: 'Giá niêm yết rõ ràng, mô tả đúng giống, đúng tình trạng cây.' },
  { title: 'Bền vững', text: 'Giá thể tái chế, hạn chế hóa chất, bao bì thân thiện môi trường.' },
  { title: 'An toàn', text: 'Thông tin khách hàng được bảo vệ: mã hóa HTTPS, mật khẩu được băm.' },
];

export default function AboutUs() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__inner">
          <div>
            <p className="eyebrow">Về chúng tôi</p>
            <h1>Câu chuyện Lan Việt Garden</h1>
            <p className="lead">
              Từ niềm đam mê của một gia đình làm vườn ở Đà Lạt, Lan Việt Garden mong muốn đưa vẻ đẹp tinh khôi
              của hoa lan đến mọi ngôi nhà Việt.
            </p>
          </div>
          <OrchidArt color="#8e3c9e" accent="#f2d16b" size={150} stem />
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div>
            <h2>Sứ mệnh</h2>
            <p>
              Chúng tôi tin rằng một chậu lan đẹp có thể làm bừng sáng cả không gian sống. Vì thế, Lan Việt Garden
              tự ươm trồng, tuyển chọn kỹ lưỡng và hướng dẫn chăm sóc tận tình để hoa luôn tươi lâu nhất có thể.
            </p>
            <p>
              Đội ngũ kỹ sư nông nghiệp của vườn luôn sẵn sàng tư vấn miễn phí cho bạn trong suốt quá trình chăm cây.
            </p>
          </div>
          <ol className="timeline">
            {TIMELINE.map((t) => (
              <li key={t.year}>
                <strong>{t.year}</strong>
                <p>{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <h2 className="text-center">Giá trị cốt lõi</h2>
          <div className="values">
            {VALUES.map((v) => (
              <div key={v.title} className="value">
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container text-center">
          <h2>Ghé thăm vườn lan</h2>
          <p className="lead">Vườn mở cửa đón khách tham quan mỗi ngày từ 7:00 đến 20:00.</p>
          <Link to="/lien-he" className="btn btn--primary btn--lg">
            Đặt lịch tham quan
          </Link>
        </div>
      </section>
    </div>
  );
}
