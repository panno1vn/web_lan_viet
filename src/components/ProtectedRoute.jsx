import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

// Chỉ để điều hướng giao diện. Việc kiểm tra quyền thật sự luôn do máy chủ thực hiện
// trên MỖI request API (requireAuth) - không tin vào kiểm tra phía client (§2.5).
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="container page-status">Đang tải…</p>;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
