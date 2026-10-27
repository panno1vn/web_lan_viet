import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import NotFound from '../pages/NotFound.jsx';

// Chỉ điều hướng giao diện. Quyền admin thật sự do máy chủ kiểm tra trên mỗi request API.
export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="container page-status">Đang tải…</p>;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  if (user.role !== 'admin') return <NotFound />;
  return <Outlet />;
}
