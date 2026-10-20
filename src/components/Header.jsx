import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import OrchidArt from './OrchidArt.jsx';

const NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/san-pham', label: 'Sản phẩm' },
  { to: '/about-us', label: 'Giới thiệu' },
  { to: '/lien-he', label: 'Liên hệ' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo" aria-label="Lan Việt Garden - Trang chủ">
          <OrchidArt size={36} color="#c2569b" accent="#f2c94c" />
          <span>
            Lan Việt <em>Garden</em>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Mở menu</span>
          <span className="nav-toggle__bar" />
        </button>

        <nav id="main-nav" className={`nav ${open ? 'nav--open' : ''}`} aria-label="Điều hướng chính">
          <ul className="nav__list">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className="nav__link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="nav__actions">
            <NavLink to="/gio-hang" className="nav__cart">
              Giỏ hàng <span className="badge">{count}</span>
            </NavLink>
            {user ? (
              <>
                <NavLink to="/tai-khoan" className="nav__link">
                  {user.fullName}
                </NavLink>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link to="/dang-nhap" className="btn btn--primary btn--sm">
                Đăng nhập
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
