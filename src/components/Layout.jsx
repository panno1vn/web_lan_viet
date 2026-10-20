import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import GardenAtmosphere from './GardenAtmosphere.jsx';

export default function Layout() {
  const { pathname, hash } = useLocation();

  // Khi chuyển trang thì cuộn lên đầu
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = hash && document.getElementById(hash.slice(1));
      if (target) target.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.home .section, .home .cta, [data-reveal]').forEach((section) => {
      section.classList.add('reveal');
      observer.observe(section);
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, hash]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
      <GardenAtmosphere />
    </div>
  );
}
