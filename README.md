# Lan Việt Garden – Website bán hoa lan

Đồ án môn **An toàn ứng dụng web và CSDL**. Website bán hoa lan xây dựng bằng **ReactJS + Vite**, điều hướng bằng **react-router**, có API **Express + SQLite** để áp dụng các quy tắc bảo mật trong `quy-tac-trien-khai-web-an-toan.md`.

## Chạy project

Yêu cầu: Node.js ≥ 22.13 (dùng module `node:sqlite` có sẵn).

```bash
npm install
npm run dev          # web: http://localhost:3000  ·  API: http://localhost:3001 (Vite proxy /api)
```

Chạy bản production (một máy chủ duy nhất ở cổng 3000):

```bash
npm run build
npm start            # http://localhost:3000
```

Có thể tạo file `.env` từ `.env.example` để đổi cấu hình. **Không commit file `.env`.**

## Các trang (react-router)

| URL | Trang |
| --- | --- |
| `/` | Trang chủ |
| `/about-us` | Giới thiệu |
| `/san-pham`, `/san-pham?q=...` | Danh sách / tìm kiếm sản phẩm |
| `/san-pham/:slug` | Chi tiết sản phẩm |
| `/gio-hang` | Giỏ hàng & đặt hàng |
| `/lien-he` | Liên hệ |
| `/dang-nhap`, `/dang-ky` | Đăng nhập / đăng ký |
| `/tai-khoan`, `/tai-khoan/don-hang/:id` | Tài khoản, đơn hàng (cần đăng nhập) |
| `*` | Trang 404 |

Chuyển trang bằng cách bấm menu (`<NavLink>`) hoặc gõ thẳng URL. Ở production, máy chủ trả `index.html` cho mọi đường dẫn không thuộc `/api`, nên mở trực tiếp `http://localhost:3000/about-us` vẫn hiện đúng trang.

## Cấu trúc thư mục

```
index.html               # HTML gốc
src/
  main.jsx, App.jsx      # khai báo BrowserRouter + các Route
  pages/                 # Home, AboutUs, Products, ProductDetail, Cart, Contact, Login, Register, Account, OrderDetail, NotFound
  components/            # Header, Footer, Layout, ProductCard, OrchidArt (SVG), FormField, ProtectedRoute
  context/               # AuthContext, CartContext
  api/client.js          # gọi API kèm CSRF token
  styles/                # global.css, home.css (định dạng trang chủ), pages.css
server/
  index.js               # Express: header bảo mật, giới hạn request, xử lý lỗi, phục vụ dist/
  config.js, db.js       # cấu hình qua biến môi trường; SQLite + prepared statements
  security/              # session.js (phiên + CSRF), validate.js (kiểm tra đầu vào), audit.js (ghi log)
  routes/                # auth.js, shop.js
```

## Các quy tắc bảo mật đã áp dụng

Số mục (§) theo file `quy-tac-trien-khai-web-an-toan.md`.

| Quy tắc | Cách làm trong project |
| --- | --- |
| §0, §1.2 Kiểm tra đầu vào ở máy chủ | `server/security/validate.js`: kiểm tra độ dài, định dạng theo whitelist, chuẩn hóa Unicode NFC trước khi kiểm tra, chặn ký tự điều khiển, từ chối trường lạ (`onlyKeys`). Phía client cũng kiểm tra, nhưng chỉ để hiện lỗi sớm cho người dùng. |
| §2.1 XSS | React tự escape mọi dữ liệu hiển thị; không dùng `dangerouslySetInnerHTML`. CSP chặt: `script-src 'self'`, `object-src 'none'`. Cookie phiên `HttpOnly`. Màu SVG được kiểm tra bằng regex trước khi render. |
| §2.2 CSRF | Token đồng bộ lưu trong phiên, gửi qua header `X-CSRF-Token`, so sánh bằng `timingSafeEqual`. Kiểm tra header `Origin`. Cookie `SameSite=Strict`. Không thay đổi dữ liệu qua GET. |
| §2.3 SQL Injection | 100% truy vấn dùng prepared statement với tham số `?`. Từ khóa tìm kiếm được escape `% _` trong mệnh đề LIKE. |
| §2.4 Xác thực | Mật khẩu băm bằng **bcrypt** (cost 12, có salt). Mật khẩu ≥ 10 ký tự, đủ 4 loại ký tự, không chứa tên đăng nhập. Sai 5 lần thì khóa tài khoản 15 phút, kèm giới hạn theo IP. CAPTCHA do máy chủ sinh, chỉ dùng một lần, khi đăng ký. Thông báo lỗi đăng nhập chung chung, và so sánh với hash giả khi email không tồn tại (chống dò tài khoản qua thời gian phản hồi). Không có tài khoản mặc định, không hardcode thông tin đăng nhập. |
| §2.5 Lỗi logic | Giá và tổng tiền luôn tính lại ở máy chủ, client chỉ gửi `productId` + `quantity`. Trừ tồn kho trong transaction với điều kiện `stock >= ?`. Trigger CSDL cấm sửa chi tiết đơn hàng đã đặt. Quyền được đọc lại từ CSDL ở mỗi request. |
| §2.6 Trình duyệt | HSTS, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Không bật CORS (chỉ cùng origin). Chống open redirect sau đăng nhập (`safeRedirect`). |
| §2.7 Case-study | Đổi mật khẩu bắt buộc nhập đúng mật khẩu hiện tại (mật khẩu rỗng bị từ chối). Bảng `audit_log` chỉ cho thêm: trigger cấm UPDATE/DELETE. |
| §3.1 Máy chủ web | Chỉ cho phép GET/HEAD/POST (các phương thức khác trả 405). Tắt `X-Powered-By`. Không liệt kê thư mục; chặn dotfiles. Giới hạn body 10 KB, chỉ nhận JSON. |
| §3.3 Phiên | Token 256 bit từ CSPRNG; CSDL chỉ lưu SHA-256 của token. Cookie `HttpOnly` + `SameSite=Strict` + `Secure` + tiền tố `__Host-` ở production. Hết hạn sau 30 phút không hoạt động, tối đa 8 giờ. Đăng nhập cấp phiên mới và hủy phiên cũ (chống session fixation; mỗi người một phiên). Đăng xuất hủy phiên. Không đặt token lên URL. |
| §3.4 Hệ thống file | File CSDL nằm ngoài thư mục web (`server/data/`, đã gitignore). `.gitignore` loại `.env`, `*.bak`, `*.old`… Build không xuất source map. Không có thông tin nhạy cảm trong comment. |
| §4.4 Xử lý ngoại lệ | Bộ xử lý lỗi tập trung: client chỉ nhận thông báo chung, chi tiết chỉ ghi ở log máy chủ. Không ghi mật khẩu/token vào log. |
| §5.4 DoS | Giới hạn tần suất: chung 300 request/15 phút, đăng nhập, đăng ký, liên hệ, đặt hàng. Tìm kiếm tối đa 60 ký tự, trả tối đa 50 dòng. Giỏ hàng tối đa 20 dòng × 20 sản phẩm. `busy_timeout` cho SQLite. |
| §5.1 Toàn vẹn | Ràng buộc `CHECK`, `UNIQUE`, khóa ngoại; transaction cho đặt hàng. |
| §5.6.4 Truy cập đối tượng | API đơn hàng luôn lọc `WHERE id = ? AND user_id = ?` (chống IDOR, OWASP A01). |
| §5.7.4 Kiểm toán | Ghi log đăng ký, đăng nhập thành công/thất bại, khóa tài khoản, đổi mật khẩu, đặt hàng, lỗi CSRF, lỗi máy chủ (kèm IP, user-agent, thời gian). |
| A06 Thành phần lỗi thời | Dùng phiên bản mới nhất của các thư viện; kiểm tra bằng `npm run audit`. |

### Giới hạn và việc cần làm khi triển khai thật

- HTTPS do reverse proxy đảm nhận (nginx/Render…). Khi đó đặt `TRUST_PROXY=1`, `FORCE_HTTPS=1`, `ALLOWED_ORIGINS=https://ten-mien-cua-ban`.
- SQLite chạy cùng máy với ứng dụng. Các quy tắc phân quyền tài khoản DBMS (§5.6.1–5.6.4), TDE, tường lửa CSDL và sao lưu (§5.7) sẽ áp dụng khi chuyển sang MySQL/SQL Server.
- CAPTCHA phép tính là bản đơn giản để minh họa. Hệ thống thật nên dùng reCAPTCHA/Turnstile.
