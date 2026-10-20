import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import FormField from '../components/FormField.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { passwordProblems, rules } from '../utils/format.js';

const EMPTY = { fullName: '', email: '', password: '', confirm: '', captcha: '' };

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [question, setQuestion] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const latestRequest = useRef(0);

  // Chỉ hiển thị câu hỏi của request mới nhất (máy chủ cũng chỉ giữ đáp án mới nhất)
  const loadCaptcha = useCallback(() => {
    const reqId = ++latestRequest.current;
    api('/captcha')
      .then((d) => reqId === latestRequest.current && setQuestion(d.question))
      .catch(() => reqId === latestRequest.current && setQuestion(''));
  }, []);

  useEffect(loadCaptcha, [loadCaptcha]);

  if (user) return <Navigate to="/tai-khoan" replace />;

  function validate() {
    const e = {};
    const name = form.fullName.trim();
    if (name.length < 2 || name.length > 80 || !rules.name.test(name)) e.fullName = 'Họ tên chỉ gồm chữ cái, 2–80 ký tự.';
    if (!rules.email.test(form.email.trim())) e.email = 'Email không hợp lệ.';
    const problems = passwordProblems(form.password);
    if (problems.length) e.password = `Mật khẩu còn thiếu: ${problems.join(', ')}.`;
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp.';
    if (!/^[0-9]{1,4}$/.test(form.captcha.trim())) e.captcha = 'Vui lòng nhập kết quả phép tính.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          captcha: form.captcha.trim(),
        },
      });
      navigate('/dang-nhap', { state: { registered: true } });
    } catch (err) {
      if (err.field && err.field in EMPTY) setErrors({ [err.field]: err.message });
      else setServerError(err.message);
      setForm((f) => ({ ...f, captcha: '' }));
      loadCaptcha(); // CAPTCHA chỉ dùng một lần
    } finally {
      setBusy(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page auth">
      <form className="form-card auth__card" onSubmit={handleSubmit} noValidate>
        <h1>Tạo tài khoản</h1>
        <FormField label="Họ và tên" value={form.fullName} onChange={set('fullName')} maxLength={80} autoComplete="name" error={errors.fullName} />
        <FormField label="Email" type="email" value={form.email} onChange={set('email')} maxLength={254} autoComplete="email" error={errors.email} />
        <FormField
          label="Mật khẩu"
          type="password"
          value={form.password}
          onChange={set('password')}
          maxLength={72}
          autoComplete="new-password"
          hint="Ít nhất 10 ký tự, gồm chữ thường, chữ hoa, chữ số và ký tự đặc biệt."
          error={errors.password}
        />
        <FormField label="Nhập lại mật khẩu" type="password" value={form.confirm} onChange={set('confirm')} maxLength={72} autoComplete="new-password" error={errors.confirm} />
        <FormField
          label={`Xác nhận bạn không phải robot: ${question || '…'}`}
          inputMode="numeric"
          value={form.captcha}
          onChange={set('captcha')}
          maxLength={4}
          autoComplete="off"
          error={errors.captcha}
        />
        {serverError && <p className="alert alert--error">{serverError}</p>}
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
          {busy ? 'Đang tạo tài khoản…' : 'Đăng ký'}
        </button>
        <p className="auth__switch">
          Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
