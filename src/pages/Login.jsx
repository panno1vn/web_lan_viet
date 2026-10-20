import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { safeRedirect } from '../utils/format.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = safeRedirect(location.state?.from, '/tai-khoan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page auth">
      <form className="form-card auth__card" onSubmit={handleSubmit} noValidate>
        <h1>Đăng nhập</h1>
        {location.state?.registered && <p className="alert alert--success">Đăng ký thành công, mời bạn đăng nhập.</p>}
        <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="username" />
        {/* Tắt autocomplete mật khẩu ở form đăng nhập theo khuyến nghị §2.4 */}
        <FormField label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} autoComplete="off" />
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        <p className="auth__switch">
          Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
}
