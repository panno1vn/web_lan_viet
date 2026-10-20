import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const { pathname } = useLocation();

  // Khi chuyển trang thì cuộn lên đầu
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
