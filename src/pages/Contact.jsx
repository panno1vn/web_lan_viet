import { useState } from 'react';
import FormField from '../components/FormField.jsx';
import { api } from '../api/client.js';
import { rules } from '../utils/format.js';

const EMPTY = { name: '', email: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [sending, setSending] = useState(false);

  function validate() {
    const e = {};
    const name = form.name.trim();
    if (name.length < 2 || name.length > 80 || !rules.name.test(name)) e.name = 'Họ tên chỉ gồm chữ cái, 2–80 ký tự.';
    if (!rules.email.test(form.email.trim())) e.email = 'Email không hợp lệ.';
    const msg = form.message.trim();
    if (msg.length < 10 || msg.length > 2000) e.message = 'Nội dung cần từ 10 đến 2000 ký tự.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (!validate()) return;
    setSending(true);
    try {
      const data = await api('/contact', {
        method: 'POST',
        body: { name: form.name.trim(), email: form.email.trim(), message: form.message.trim() },
      });
      setForm(EMPTY);
      setStatus({ type: 'success', text: data.message });
    } catch (err) {
      if (err.field && err.field in EMPTY) setErrors({ [err.field]: err.message });
      else setStatus({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page">
      <section className="page-hero page-hero--compact">
        <div className="container">
          <p className="eyebrow">Liên hệ</p>
          <h1>Chúng tôi luôn sẵn sàng lắng nghe</h1>
        </div>
      </section>
      <section className="section">
        <div className="container two-col">
          <div className="contact-info">
            <h2>Thông tin vườn lan</h2>
            <ul>
              <li><strong>Địa chỉ:</strong> 123 Đường Hoa Lan, Phường 8, Đà Lạt</li>
              <li><strong>Hotline:</strong> 0900 000 000</li>
              <li><strong>Email:</strong> lienhe@lanviet.example</li>
              <li><strong>Giờ mở cửa:</strong> 7:00 – 20:00 tất cả các ngày</li>
            </ul>
            <p>Bạn cần tư vấn chọn lan, báo giá sỉ hay đặt lịch tham quan vườn? Hãy để lại lời nhắn.</p>
          </div>
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            <FormField label="Họ và tên" value={form.name} onChange={set('name')} maxLength={80} autoComplete="name" error={errors.name} />
            <FormField label="Email" type="email" value={form.email} onChange={set('email')} maxLength={254} autoComplete="email" error={errors.email} />
            <FormField label="Nội dung" as="textarea" rows={5} value={form.message} onChange={set('message')} maxLength={2000} error={errors.message} />
            {status.text && <p className={`alert alert--${status.type}`}>{status.text}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={sending}>
              {sending ? 'Đang gửi…' : 'Gửi lời nhắn'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
