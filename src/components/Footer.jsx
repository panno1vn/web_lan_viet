import { Link } from 'react-router';
import { productPhotos } from '../data/productPhotos.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h3 className="footer__brand">Lan Việt Garden</h3>
          <p>Vườn lan gia đình từ Đà Lạt, mang vẻ đẹp tinh khôi của hoa lan đến mọi không gian sống.</p>
        </div>
        <div>
          <h4>Khám phá</h4>
          <ul>
            <li><Link to="/san-pham">Tất cả sản phẩm</Link></li>
            <li><Link to="/about-us">Về chúng tôi</Link></li>
            <li><Link to="/about-us#lien-he">Liên hệ</Link></li>
          </ul>
        </div>
        <div>
          <h4>Tài khoản</h4>
          <ul>
            <li><Link to="/dang-nhap">Đăng nhập</Link></li>
            <li><Link to="/dang-ky">Đăng ký</Link></li>
            <li><Link to="/gio-hang">Giỏ hàng</Link></li>
          </ul>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <ul>
            <li>123 Đường Hoa Lan, Đà Lạt</li>
            <li>Hotline: 0900 000 000</li>
            <li>Giờ mở cửa: 7:00 – 20:00</li>
          </ul>
        </div>
      </div>
      <details className="container photo-sources">
        <summary>Nguồn ảnh hoa lan</summary>
        <p>Ảnh tham khảo từ Wikimedia Commons; đã thu nhỏ, nén JPEG và cắt khung khi hiển thị. Ảnh giữ nguyên giấy phép gốc.</p>
        <ul>{Object.entries(productPhotos).map(([slug, photo]) => <li key={slug}><a href={photo.source} target="_blank" rel="noreferrer">{slug}</a> — {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.licenseLabel}</a></li>)}</ul>
      </details>
      <p className="footer__copy">© {new Date().getFullYear()} Lan Việt Garden · Đồ án môn An toàn ứng dụng web và CSDL</p>
    </footer>
  );
}
