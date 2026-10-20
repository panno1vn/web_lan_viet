import { Link } from 'react-router';
import OrchidArt from '../components/OrchidArt.jsx';

export default function NotFound() {
  return (
    <div className="page container notfound">
      <OrchidArt color="#d9c7d6" accent="#bfa8bb" size={120} />
      <h1>404 – Không tìm thấy trang</h1>
      <p>Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không đúng.</p>
      <Link to="/" className="btn btn--primary">
        Về trang chủ
      </Link>
    </div>
  );
}
