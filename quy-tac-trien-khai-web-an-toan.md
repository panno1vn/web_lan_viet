# Quy tắc bảo mật & checklist triển khai ứng dụng web an toàn

> Tổng hợp toàn bộ môn **An toàn ứng dụng web và CSDL** (Chương 1–7).
> Nguồn: giáo trình *Bài giảng An toàn ứng dụng web và CSDL* — TS. Hoàng Xuân Dậu, bản 2021 (157 trang) và slide ThS. Phan Nghĩa Hiệp, lấy từ Drive lớp.
> Mục tiêu: một bộ quy tắc + checklist để **phát triển và triển khai web không dính bất kỳ lỗ hổng nào đã học trong môn**.

---

## 0. Bốn nguyên tắc nền (áp dụng cho mọi quy tắc bên dưới)

1. **Phòng vệ nhiều lớp theo chiều sâu (Defense in depth)** — không dựa vào một lớp duy nhất. Ba lớp: **Mạng** (firewall, IDS/IPS, switch, router cấu hình chuẩn) → **Máy chủ** (OS, DBMS, phần mềm được hardening) → **Ứng dụng** (xác thực, trao quyền, kiểm tra đầu vào, quản lý phiên, mã hóa, ghi log).
2. **Không tin bất kỳ đầu vào nào** — mọi dữ liệu từ người dùng/mạng/nguồn ngoài đều phải kiểm tra, và **kiểm tra bắt buộc ở phía máy chủ** (client chỉ để trải nghiệm, có thể bị tắt JS hoặc giả form).
3. **Quyền tối thiểu (least privilege)** — mỗi người dùng, dịch vụ, tài khoản DB chỉ được cấp quyền "vừa đủ" để làm việc được giao.
4. **Bảo mật từ thiết kế, không "vá sau"** — đưa yêu cầu bảo mật vào từ pha phân tích yêu cầu đến phát hành (hướng toàn diện), vì chi phí sửa lỗi tăng vọt theo thời điểm phát hiện (≈1 ở thiết kế → ≈30 ở release) và *thiết kế không an toàn thì không thể vá bằng cài đặt hoàn hảo* (OWASP A04:2021 Insecure Design).

---

## 1. Lớp nền tảng (Chương 1)

### 1.1 Kiến trúc & phân lớp
- [ ] Chia ứng dụng theo kiến trúc 3 lớp: trình diễn (PL/UI) · lô gic nghiệp vụ (BLL, chứa quy định an ninh) · truy cập dữ liệu (DAL, dùng stored procedure). Không để lớp trình diễn gọi thẳng SQL.
- [ ] Người dùng Internet **chỉ** truy cập được trang web, **cấm** truy cập trực tiếp vào CSDL (giảm bề mặt tấn công).
- [ ] Dùng **HTTPS thay cho HTTP** cho mọi dữ liệu nhạy cảm và dữ liệu truyền giữa client–server.

### 1.2 Ba phương pháp tiếp cận bảo mật (phải làm cả ba)
1. **Kiểm tra dữ liệu đầu vào** — cả client lẫn server, nhưng server là bắt buộc; kiểm tra kích thước, định dạng, nội dung, sự hợp lý; ưu tiên **bộ lọc của OWASP/Microsoft** (đã kiểm thử kỹ) hơn bộ lọc tự viết.
2. **Giảm thiểu giao diện có thể bị tấn công** — kiểm soát truy cập, quyền vừa đủ, tắt thứ không cần.
3. **Phòng vệ theo chiều sâu** — kết hợp 3 lớp.

### 1.3 Ghi nhớ OWASP Top 10 (để không bỏ sót lớp lỗ hổng nào)

| # | 2017 | 2021 |
| --- | --- | --- |
| 1 | Injection | **Broken Access Control** (từ #5 lên #1) |
| 2 | Broken Authentication | Cryptographic Failures |
| 3 | Sensitive Data Exposure | **Injection** (gộp cả XSS) |
| 4 | XXE | **Insecure Design** (mới) |
| 5 | Broken Access Control | Security Misconfiguration |
| 6 | Security Misconfiguration | Vulnerable & Outdated Components |
| 7 | XSS | Identification & Authentication Failures |
| 8 | Insecure Deserialization | **Software & Data Integrity Failures** (mới) |
| 9 | Vulnerable Components | Security Logging & Monitoring Failures |
| 10 | Insufficient Logging & Monitoring | **SSRF** (mới) |

---

## 2. Chống từng lớp lỗ hổng tấn công web (Chương 2)

Với mỗi lỗ hổng: **nguyên nhân gốc → quy tắc bắt buộc**.

### 2.1 XSS (Cross-Site Scripting) — chèn script chạy trong trình duyệt nạn nhân
**3 loại:** Stored (lưu trong CSDL — diễn đàn, bình luận), Reflected (phản chiếu ngay — trang tìm kiếm, link gửi qua email), DOM-based (script client xử lý `document.URL`/`location`).
**7 vị trí có thể bị chèn:** URI, trường nhập liệu, HTTP header & cookie, JSON, thuộc tính DOM, CSS, nội dung do người dùng tạo.

Quy tắc:
- [ ] **Escaping đầu ra theo ngữ cảnh** — thay ký tự đặc biệt HTML (`<`→`&#60;`, `>`→`&#62;`, `&`, `"`, `'`) đúng ngữ cảnh (HTML body / thuộc tính / JS / URL / CSS). Dùng thư viện chuẩn **OWASP ESAPI** hoặc **Microsoft AntiXSS**, không tự viết.
- [ ] **Bộ lọc XSS ở phía server** để loại thẻ HTML/CSS/script khỏi đầu vào; cập nhật bộ lọc thường xuyên.
- [ ] Đặt cookie phiên cờ **`HttpOnly`** (JS không đọc được) → chặn XSS đánh cắp cookie.
- [ ] Thêm **Content Security Policy (CSP)** để hạn chế nguồn script được phép chạy.
- [ ] Kiểm tra cả nội dung người dùng tải lên (ảnh, video, tài liệu) vì có thể chứa mã.

### 2.2 CSRF (Cross-Site Request Forgery) — lừa trình duyệt nạn nhân gửi yêu cầu bằng phiên đang đăng nhập
Quy tắc:
- [ ] **Anti-CSRF token ("chuỗi đồng bộ")** cho mọi thao tác thay đổi trạng thái — server sinh token, gắn vào form, kiểm tra khi nhận yêu cầu. Dùng thư viện **OWASP/PHP/.NET CSRF Guard**.
- [ ] Đặt cookie cờ **`SameSite`** (Lax/Strict).
- [ ] **Không dùng GET** cho thao tác thay đổi dữ liệu (chuyển tiền, đổi email…); GET chỉ để truy vấn.
- [ ] Với thao tác quan trọng: **xác thực lại mật khẩu / OTP / CAPTCHA**.
- [ ] Cẩn trọng với tính năng "tự động đăng nhập bằng cookie" vì làm tăng rủi ro CSRF.

### 2.3 SQL Injection — chèn mã SQL vào dữ liệu để chạy trên máy chủ CSDL
**2 nguyên nhân gốc:** (1) không kiểm tra đầu vào; (2) dùng **câu lệnh SQL động nối chuỗi** dữ liệu người dùng vào lệnh.
**4 tác hại:** vượt xác thực (`' OR 1=1--`) · chèn/sửa/xóa dữ liệu (nhiều lệnh ngăn bằng `;`) · đánh cắp dữ liệu (`UNION SELECT`, `@@version`, `ORDER BY`, bảng metadata) · chiếm quyền máy chủ (khi đồng thời có lỗi SQLi + ứng dụng dùng tài khoản quản trị → `xp_cmdshell`).

Quy tắc (biện pháp gốc rễ đứng đầu):
- [ ] **Tham số hóa truy vấn (prepared statements) / stored procedure** ở mọi nơi — tách dữ liệu khỏi mã. Hạn chế SQL động bên trong thủ tục.
- [ ] Lọc đầu vào: kích thước, định dạng, ký tự đặc biệt (`'`, `--`, `;`, `*`, `=`) và từ khóa SQL.
- [ ] **Quyền tối thiểu cho tài khoản DB của ứng dụng** — **không dùng `sa` (SQL Server) / `root` (MySQL)**; chỉ cấp quyền chạy thủ tục cần thiết.
- [ ] **Vô hiệu hóa thủ tục hệ thống nguy hiểm** (`xp_cmdshell`, `sp_send_dbmail`…).
- [ ] Rà quét chủ động bằng **SQLMap / OWASP ZAP / Acunetix** trên hệ thống của mình.

### 2.4 Tấn công cơ chế xác thực & phiên
**Dạng:** phát lại session ID · vét cạn (dựa vào thông báo lỗi khác nhau hoặc thời gian phản hồi) · nghe lén (Tcpdump, Wireshark, Firesheep — WLAN dễ bị) · khởi tạo lại mật khẩu yếu · XSS/SQLi để cắp phiên.

Quy tắc:
- [ ] **Lưu mật khẩu dạng băm** (không lưu rõ, không mã hóa bằng khóa); dùng hàm băm chuyên dụng có salt (**bcrypt/Argon2** — khuyến nghị ngoài giáo trình).
- [ ] Đặt **độ dài & độ khó tối thiểu** cho mật khẩu, đổi định kỳ, hạn chế dùng lại, không trùng username.
- [ ] **Truyền thông tin xác thực qua SSL/TLS**; dùng OTP / Challenge-Response / **OAuth / OpenID** khi phù hợp.
- [ ] **Ngưỡng khóa tài khoản** khi đăng nhập sai nhiều lần (ví dụ: sai 3 lần/IP trong 10 phút → khóa 1 giờ).
- [ ] **CAPTCHA** chống đăng nhập/đăng ký tự động.
- [ ] Thông báo cho người dùng sự kiện nhạy cảm (đăng nhập lạ, đổi mật khẩu) và yêu cầu xác thực lại.
- [ ] **Không** dùng tài khoản ngầm định (admin/guest/root), **không** hardcode thông tin đăng nhập, **tránh** Remember Me / Autocomplete ở form đăng nhập.
- [ ] Chống phishing: HTTPS + hiển thị rõ tên/logo tổ chức + chứng chỉ số.

### 2.5 Tấn công khiếm khuyết thiết kế (logic)
Không có công cụ quét tự động — mỗi website một kiểu. Dạng: lạm dụng lưu trình (coupon nhiều lần, đổi POST/GET, bỏ/lặp bước, đảo thứ tự) · lỗi chính sách · mẫu thiết kế không an toàn · lỗi cài đặt mã hóa.

Quy tắc:
- [ ] **Kiểm tra trật tự và quyền trên MỖI bước/MỖI yêu cầu ở server**, không chỉ một lần lúc đăng nhập (tránh lỗi "người bị hạ quyền vẫn giữ quyền cũ đến hết phiên").
- [ ] Khóa đơn hàng sau khi thanh toán; không cho sửa số lượng/thêm hàng sau thanh toán.
- [ ] **Không tin dữ liệu bất biến phía client** (giá, quyền, trạng thái) — xác minh lại ở server.
- [ ] Không trộn lẫn dữ liệu và mã; chuẩn hóa dữ liệu đầy đủ trước khi lọc (chống cú pháp đồng nghĩa, mã hóa sai để lách bộ lọc).
- [ ] Mã hóa: dùng **thuật toán chuẩn, thư viện đã kiểm thử**, **sinh số ngẫu nhiên thực sự** (không dùng pseudo-random yếu), **không dùng XOR**; không trả thông báo lỗi giải mã cho client.
- [ ] Viết tài liệu thiết kế, tạo test case toàn diện (gồm test an ninh: XSS/CSRF/SQLi).

### 2.6 Tấn công trình duyệt & quyền riêng tư
Dạng: malware nhúng trong trang (script/iframe ẩn), plugin có lỗ hổng (Flash, Greasemonkey), ánh xạ lại DNS phá Same Origin Policy, cookie theo dõi sống lâu.

Quy tắc phía ứng dụng (để bảo vệ người dùng):
- [ ] Phục vụ **HTTPS + HSTS**; không nhúng thành phần HTTP trong trang HTTPS (tránh rò rỉ token).
- [ ] **CSP** chống XSS/clickjacking; `X-Frame-Options` (hoặc CSP `frame-ancestors`) chống clickjacking.
- [ ] Cookie: **`HttpOnly` + `Secure` + `SameSite`**, giới hạn `Domain`/`Path`, đặt thời gian hết hạn, hạn chế cookie sống lâu.
- [ ] Cấu hình **CORS** chặt; không nới lỏng Same Origin Policy.
- [ ] Khuyến nghị người dùng: cập nhật trình duyệt/plugin, dùng HTTPS Everywhere/NoScript, không chạy trình duyệt bằng quyền admin.

### 2.7 Bài học từ case-study (tránh lặp lại)
- [ ] **Đổi mật khẩu:** tách giao diện admin và user; kiểm tra quyền chặt (đừng để "mật khẩu hiện tại rỗng ⇒ coi là admin").
- [ ] **Đặt hàng:** kiểm tra trật tự các bước ở server.
- [ ] **Ghi log:** phân loại & lưu log lâu dài; log quan trọng **không cho xóa** (hoặc chỉ xóa sau thời hạn) để không bị "admin ác tính xóa dấu vết".

---

## 3. Cứng hóa máy chủ, ứng dụng, phiên, file, trình duyệt (Chương 3)

### 3.1 Máy chủ web
**Lỗ hổng cấu hình (4):** tài khoản quản trị ngầm định · nội dung ngầm định (`phpinfo.php`, trang mẫu `/IISSAMPLES`, PL/SQL gateway của Oracle, tài liệu) · liệt kê thư mục · phương thức nguy hiểm.
**Lỗ hổng phần mềm (3):** tràn bộ đệm · duyệt đường dẫn (path traversal) · lỗi mã hóa/chuẩn hóa URL.

Quy tắc:
- [ ] **Đổi tên/mật khẩu hoặc khóa** tài khoản quản trị ngầm định.
- [ ] **Gỡ nội dung ngầm định** (trang gỡ rối, trang mẫu, tài liệu) khỏi production.
- [ ] **Cấm liệt kê thư mục**; đảm bảo mọi thư mục có trang mặc định (trả 403 khi không có).
- [ ] **Khóa phương thức HTTP không dùng** (PUT, DELETE, COPY, MOVE, SEARCH, TRACE).
- [ ] Giới hạn giao diện quản trị theo **IP/ACL/mạng nội bộ**.
- [ ] Phân quyền thư mục: thư mục tĩnh **chỉ đọc**; thư mục upload **đọc/ghi, KHÔNG thực thi**.
- [ ] Chống **path traversal**: không đọc/ghi file theo tham số người dùng; lọc chuỗi `../`; chuẩn hóa đường dẫn rồi kiểm tra vẫn nằm trong thư mục cho phép.
- [ ] Chọn phần mềm máy chủ uy tín; **cập nhật bản vá** thường xuyên; theo dõi Bugtraq/Full Disclosure; gỡ thành phần thừa; chạy ứng dụng với quyền hạn chế.

### 3.2 Xác thực & trao quyền trong ứng dụng
Điều khiển truy cập = 3 dịch vụ: **Authentication → Authorization → Administration**; mục tiêu CIA.
- [ ] HTTP Basic (base64 **không bí mật**) chỉ dùng kèm SSL/TLS; ưu tiên cơ chế mạnh hơn.
- [ ] Hỗ trợ đa nhân tố khi cần (biết / có / là ai).

### 3.3 Bảo mật phiên (session) — 3 nhóm biện pháp
1. **Sinh token mạnh:** ngẫu nhiên, khó đoán, đủ dài, **không có nghĩa**, không phụ thuộc thời gian.
2. **Bảo vệ token cả vòng đời:**
   - [ ] Truyền qua **HTTPS suốt phiên** (không chỉ lúc đăng nhập).
   - [ ] **Không đưa token lên URL** (dùng cookie/trường ẩn + POST).
   - [ ] Có **Đăng xuất** hủy token; **hết hạn khi không hoạt động**.
   - [ ] **Một người một phiên**; đăng nhập mới hủy phiên cũ (chống session fixation).
   - [ ] Giới hạn `Domain`/`Path` của cookie; chống XSS/CSRF.
3. **Ghi log/giám sát/cảnh báo:** theo dõi yêu cầu chứa token không hợp lệ (dấu hiệu vét cạn), cảnh báo hành vi bất thường.

### 3.4 Bảo mật hệ thống file
- [ ] Phân quyền theo khu vực: công cộng / nội bộ (đăng nhập) / quản trị (giới hạn IP) / nhạy cảm (hạn chế).
- [ ] **Giữ bí mật mã nguồn:** xóa file backup của trình soạn thảo (`.bak`, `.old`, `.1`…), xóa thư mục `.git` khỏi production; không để username/password trong chú thích HTML.
- [ ] Mã nguồn & file cấu hình **nằm ngoài webroot**.
- [ ] Rà web log tìm lỗi 404/403/500 bất thường.
- [ ] Obscurity (cổng/URL không chuẩn) chỉ là biện pháp **bổ sung**, không dùng đơn độc.

### 3.5 Bảo mật trình duyệt (xem §2.6)

---

## 4. Bảo mật trong phát triển & triển khai (Chương 4)

### 4.1 Chọn hướng tiếp cận
- [ ] Ưu tiên **hướng toàn diện** (đưa bảo mật từ phân tích yêu cầu → phát hành), không chỉ "thâm nhập và vá" (pentest cuối — khó tìm hết lỗi, sửa muộn tốn kém).

### 4.2 Biện pháp theo từng thành phần (Hình 4.2)
| Thành phần | Biện pháp |
| --- | --- |
| Trình duyệt | Xác thực người dùng |
| Đường truyền browser↔server | Bảo vệ dữ liệu nhạy cảm; ngăn sửa tham số; ngăn chiếm phiên/phát lại cookie |
| Web server | Cấu hình an toàn, kiểm tra đầu vào, cấp quyền, xử lý ngoại lệ |
| Application server | Xác thực/cấp quyền luồng đến; kiểm toán, ghi log giao dịch |
| Đường truyền app↔DB | Bảo vệ dữ liệu nhạy cảm |
| DB server | Mã hóa/băm dữ liệu nhạy cảm |

### 4.3 Bảo mật khi triển khai (5 nhóm)
Bảo mật ứng dụng · bảo mật máy chủ · bảo mật theo tô pô triển khai · bảo mật hạ tầng mạng · **chính sách & thủ tục an toàn** (áp dụng cho tất cả).

### 4.4 Checklist 10 định hướng thiết kế an toàn
Kiểm tra đầu vào (tập trung ở server) · Xác thực (chia khu vực quyền, mật khẩu mạnh, SSL/TLS) · Cấp quyền (tối thiểu, chi tiết, tách đặc quyền) · Quản lý cấu hình (tài khoản quyền tối thiểu, không lưu thông tin dạng rõ, kênh quản trị bảo mật) · Dữ liệu nhạy cảm (mã hóa khi truyền, không lưu trong cookie cố định, không gửi bằng GET) · Quản lý phiên (timeout, kênh bảo mật, mã hóa cookie) · Mã hóa (không tự viết, thuật toán/khóa phù hợp, đổi khóa định kỳ, lưu khóa an toàn) · Xử lý tham số (mã hóa cookie nhạy cảm, không tin trường client sửa được) · Quản lý ngoại lệ (xử lý có cấu trúc, **không lộ chi tiết lỗi**, không ghi log mật khẩu) · Kiểm toán & ghi log (ghi ở mọi lớp, giới hạn truy cập file log, sao lưu & phân tích).

### 4.5 Mô hình phát triển phần mềm an toàn
- **Microsoft SDL (7 pha):** Training → Requirements → Design (threat modeling, giảm bề mặt tấn công) → Implementation (công cụ được duyệt, cấm hàm không an toàn, phân tích tĩnh) → Verification (phân tích động, fuzzing) → Release (kế hoạch phản ứng sự cố, Final Security Review) → Response.
- **OWASP CLASP:** hướng hành động, dựa trên vai trò, 24 hoạt động.
- **OWASP SAMM:** mô hình mức trưởng thành, 4 chức năng × 3 thực hành — Governance / Construction / Verification / Deployment.

### 4.6 10 lời khuyên của Microsoft (rút gọn)
Không tin đầu vào · dịch vụ không chạy quyền quản trị · áp dụng best practice SQL Server · bảo vệ tài nguyên · kiểm toán/ghi log/báo cáo · phân tích mã nguồn · phòng vệ nhiều lớp · **tắt thông báo lỗi chi tiết** · nắm 10 quy tắc quản trị · có kế hoạch phản ứng sự cố.

---

## 5. Bảo mật cơ sở dữ liệu (Chương 5–7)

> Ghi chú nguồn: Chương 5, 6, 7 đều lấy trực tiếp từ slide của thầy (*[5] CHUONG 5_TONG QUAN VE AN TOAN CSDL*, *[6] CHUONG 6_CAC CO CHE BAO MAT CSDL*, *[7] CHUONG 7_SAO LUU, KHOI PHUC DU PHONG, KIEM TOAN VA GIAM SAT HOAT DONG CSDL*). Riêng §5.5 (top 10 lỗ hổng) chưa đủ 10 mục: phần này nằm cuối slide Chương 5, vượt giới hạn đọc của công cụ.

### 5.1 Yêu cầu bảo mật CSDL — CIA (mục 5.2)
- [ ] **Bí mật:** chỉ người dùng có thẩm quyền mới truy cập, qua cơ chế kiểm soát truy cập = **xác thực + trao quyền** (Hình 5.10); bổ sung **bảo vệ vật lý**.
- [ ] **Toàn vẹn:** dữ liệu chỉ được sửa bởi người có thẩm quyền, phải hợp lệ, nhất quán, chính xác; đảm bảo bằng **ràng buộc dữ liệu (constraints)**, phép kiểm tra trong CSDL, cơ chế xử lý dữ liệu (Hình 5.11).
- [ ] **Sẵn dùng:** người dùng hợp pháp truy cập được bất cứ khi nào; đảm bảo bằng **chuỗi máy chủ CSDL + cân bằng tải** (Hình 5.12). Đo bằng tỷ lệ phục vụ A = Uptime / (Uptime + Downtime), thời gian trung bình giữa các sự cố, thời gian sửa chữa, thời gian khôi phục.

### 5.2 Mô hình truy cập CSDL — chọn đúng mô hình (mục 5.1.2)
- [ ] **Không** cho người dùng/máy khách kết nối **trực tiếp** đến DBMS — mô hình này chỉ dành cho người quản trị CSDL.
- [ ] Ứng dụng web dùng mô hình **gián tiếp qua máy chủ web**.
- [ ] Ứng dụng đòi hỏi bảo mật cao: **gián tiếp + tường lửa riêng** giữa browser–web server và web server–DB server (Hình 5.4).
- [ ] Ưu tiên thao tác dữ liệu qua **stored procedure** (Hình 5.9) thay vì lệnh SQL trực tiếp.

### 5.3 Yếu tố liên quan & mô hình 7 lớp (mục 5.3)
Bảo mật CSDL liên quan đến **con người, phần mềm, dữ liệu**, với 3 nhân tố: mối đe dọa · rủi ro · lỗ hổng.
- **Mối đe dọa:** con người (tin tặc, người dùng ác tính — nguy hiểm nhất), mã độc, tai họa công nghệ, tai họa tự nhiên.
- **Rủi ro (4 nguồn):** con người, dữ liệu, phần cứng, sự tín nhiệm.
- **Lỗ hổng (4 loại):** lỗi người dùng (thường xuyên nhất), thiết kế & lập trình, phần mềm, **cài đặt & cấu hình (rủi ro cao nhất)**.

Nguyên tắc tổng quát: **giảm thiểu truy cập trực tiếp vào dữ liệu và thu nhỏ bề mặt tấn công CSDL**. Phương pháp thực hiện bảo mật CSDL đi song song vòng đời phát triển phần mềm: Nhận dạng rủi ro → Đánh giá rủi ro → Thiết kế kiểm soát → Áp dụng → Đánh giá hiệu quả → Kiểm toán (Hình 5.18).

| Lớp (Hình 5.17) | Quy tắc |
| --- | --- |
| Con người | Hạn chế truy cập vật lý đến phần cứng & tài liệu; nhận dạng/xác thực (thẻ ID, PIN, mật khẩu, sinh trắc); đào tạo quản trị viên & người dùng; chính sách & thủ tục kiểm soát an ninh |
| Ứng dụng | Xác thực người dùng ứng dụng; áp dụng đúng quy trình xử lý công việc; **SSO** cho máy chủ CSDL và các ứng dụng liên kết (Hình 5.19) |
| Mạng | Tường lửa chống xâm nhập; **VPN** bảo vệ dữ liệu trên đường truyền; biện pháp xác thực |
| Hệ điều hành | Xác thực người dùng; chính sách mật khẩu chặt; phát hiện xâm nhập; quản lý tài khoản |
| Hệ quản trị CSDL | Cấu hình, phân quyền, vá lỗi DBMS (chi tiết ở §5.6) |
| File dữ liệu | Quyền truy cập file; giám sát truy cập file |
| Dữ liệu | Kiểm tra dữ liệu; ràng buộc dữ liệu; **mã hóa dữ liệu** |

### 5.4 Các dạng tấn công CSDL & phòng chống (mục 5.4)
Bốn dạng: **SQL Injection** (xem §2.3), **tràn bộ đệm**, **từ chối dịch vụ**, **Trojan trên CSDL**.

**Từ chối dịch vụ (DoS) vào CSDL**, 4 dạng:
1. *Lạm dụng tính năng CSDL:* biết tên người dùng thì cố tình đăng nhập sai nhiều lần để tài khoản thật bị khóa; hoặc lợi dụng cấu hình tự tăng tài nguyên để gửi hàng loạt yêu cầu giả mạo đến khi máy chủ sập.
2. *Câu truy vấn phức tạp:* truy vấn lồng nhau/đệ quy, toán tử `IN` với danh sách rất dài, `JOIN` sinh tập kết quả cực lớn, hàm do người dùng tự viết.
3. *Khai thác lỗi & khiếm khuyết:* tràn bộ đệm (ví dụ **sâu Slammer/Sapphire** tấn công MS SQL 2000 năm 2003), SQLi, lỗi thiết lập quyền.
4. *Tấn công qua lớp ứng dụng:* thêm hàng nghìn sản phẩm vào giỏ hàng rồi liên tục xem lại; script liên tục gọi trang có truy vấn nặng.

Phòng chống DoS:
- [ ] **Cấu hình máy chủ & CSDL:** xóa/vô hiệu hóa tài khoản, tính năng, dịch vụ không dùng; không cho người ngoài kết nối trực tiếp (dùng mô hình gián tiếp); chính sách mật khẩu & phân quyền chặt; **chỉ cấp quyền chạy thủ tục**, hạn chế lệnh SQL trực tiếp trên bảng.
- [ ] **Đặt ngưỡng tài nguyên:** số truy vấn/phút, **timeout cho truy vấn lớn**, ngưỡng CPU/bộ nhớ, giới hạn số người dùng đăng nhập đồng thời.
- [ ] **Cập nhật bản vá** OS, DBMS, ứng dụng liên quan; nâng cấp lên phiên bản ổn định, an toàn hơn.
- [ ] **Giám sát hoạt động CSDL:** truy vấn bất thường/không hợp lệ, tần suất đăng nhập, truy cập đối tượng quan trọng hoặc bị cấm, mức dùng CPU/bộ nhớ/đĩa/mạng.
- [ ] **Tường lửa:** proxy lọc truy vấn độc hại trước CSDL (ví dụ **GreenSQL**, Hình 5.20) và **WAF** lọc yêu cầu HTTP nguy hiểm trước khi đến ứng dụng web (Hình 5.21).

**Trojan trên CSDL:** đoạn mã SQL độc nhúng vào thủ tục CSDL, lợi dụng cơ chế kiểm soát truy cập tùy quyền (DAC) để làm việc mà tác giả không có quyền làm trực tiếp. Hai kịch bản trong slide: lập trình viên ít kinh nghiệm chép đoạn mã từ nguồn không rõ ràng vào thủ tục; tin tặc chèn mã vào thủ tục chạy định kỳ (ví dụ thủ tục tính lương cuối tháng).
- [ ] **Kiểm soát việc tạo/sửa thủ tục:** cấm người dùng thường tạo/sửa thủ tục, hàm trên **máy chủ production**; thủ tục được viết và kiểm thử kỹ trên **máy chủ development**, chỉ quản trị viên triển khai lên production.
- [ ] **Không dùng mã SQL từ nguồn không rõ ràng**, nhất là từ Internet, khi chưa kiểm tra kỹ.
- [ ] **Ghi log và lưu phiên bản** mã nguồn của thủ tục, hàm.
- [ ] **Giám sát việc thực hiện thủ tục/hàm/trigger**, nhất là thủ tục quan trọng, phức tạp, chạy định kỳ hoặc tự kích hoạt.

### 5.5 Top 10 lỗ hổng CSDL thực tế (mục 5.4.2 giáo trình)
Phần này mình chưa đọc được nguyên văn. Danh mục hình của giáo trình xác nhận các mục sau, kèm quy tắc tương ứng:

| Lỗ hổng (theo danh mục hình) | Quy tắc phòng chống |
| --- | --- |
| **Mật khẩu rỗng/ngầm định** trong DBMS (Hình 5.22) | Đổi toàn bộ mật khẩu mặc định; cấm tài khoản mật khẩu rỗng |
| **Lạm dụng đặc quyền** (Hình 5.23–5.25: từ quyền thấp, chỉnh chính sách JVM, giành quyền tối đa trên OS) | Quyền tối thiểu & chi tiết; rà soát quyền định kỳ; tách nhiệm vụ |
| **Bật tính năng không dùng** (Hình 5.26) | Tắt/gỡ tính năng, thủ tục, dịch vụ không cần |
| **Cấu hình DBMS sai** (Hình 5.27) | Hardening theo hướng dẫn của nhà cung cấp; rà soát cấu hình |
| **Leo thang đặc quyền** (Hình 5.28–5.29) | Vá lỗi DBMS kịp thời; quyền tối thiểu; giám sát thay đổi quyền |

Các mục còn lại của top 10 cần đối chiếu với giáo trình (mục 5.4.2, trang 118–123).

### 5.6 Cơ chế bảo mật CSDL (Chương 6)
Mô hình bảo mật tổng quát có 4 khâu: **Authentication** (ai đây?) → **Authorization** (được làm gì?) → **Encryption** (ai được thấy?) → **Audit** (ai đã làm?).

#### 5.6.1 Xác thực & trao quyền trong CSDL (mục 6.1.1)
4 phương pháp xác thực mà các DBMS hỗ trợ:

| Phương pháp | Đánh giá trong slide |
| --- | --- |
| Không xác thực / tin tưởng máy khách (No auth / Trusted client) | **Rủi ro cao, không nên dùng** |
| Xác thực dựa trên hệ điều hành | **Nên dùng**: OS có cơ chế quản lý người dùng và xác thực khá mạnh |
| Xác thực dựa trên DBMS | Dùng username + mật khẩu do DBMS quản lý |
| Hỗn hợp (OS hoặc DBMS) | Cho phép chọn một trong hai |

Theo từng DBMS:
- **IBM DB2** (UDB 8.2), hỗ trợ nhiều phương pháp nhất: `SERVER_ENCRYPT`, `KERBEROS`, `KRB_SERVER_ENCRYPT`, `DATA_ENCRYPT` (mã hóa cả phiên), `DATA_ENCRYPT_CMP` (chỉ mã hóa nếu máy khách hỗ trợ), `GSSPLUGIN` (theo GSS API), `GSS_SERVER_ENCRYPT`.
- **SQL Server**, 2 phương pháp: **Windows authentication**, được Microsoft khuyến nghị; và **Mixed** (Windows hoặc SQL Server, dùng NTLM/Kerberos nếu máy khách hỗ trợ).
- **Oracle**, 2 phương pháp phổ biến: xác thực bởi hệ điều hành hoặc bởi Oracle Server.

Quy tắc:
- [ ] Không bao giờ dùng chế độ "không xác thực / tin tưởng máy khách".
- [ ] Ưu tiên xác thực dựa trên hệ điều hành (Windows authentication với SQL Server).
- [ ] Lập **danh sách người dùng có quyền quản trị CSDL**, gồm cả người dùng OS lẫn DBMS, và giám sát hoạt động của họ.
- [ ] Hạn chế tối thiểu số người có quyền quản trị CSDL.
- [ ] Người có quyền quản trị **không** dùng tài khoản đó cho các thao tác dữ liệu thường ngày của ứng dụng.

#### 5.6.2 Bảo mật mật khẩu CSDL (mục 6.1.2)
Mật khẩu vẫn phổ biến nhất vì đơn giản, rẻ và đủ mức an toàn tối thiểu. Độ an toàn phụ thuộc 2 yếu tố: **độ khó đoán** (số loại ký tự, độ dài) và **tuổi thọ** mật khẩu.
- [ ] Mật khẩu truy cập CSDL từ ứng dụng có **đủ 4 loại ký tự** (thường, hoa, số, đặc biệt) và **≥ 10 ký tự**.
- [ ] Đặt thời gian sống của mật khẩu theo chính sách an ninh của tổ chức.
- [ ] **Không dùng mật khẩu ngầm định hoặc rỗng.** Ví dụ trong slide: SQL Server 7/2000 cho phép tài khoản `sa` không có mật khẩu.
- [ ] Không dùng mật khẩu ngắn, dễ đoán (tên, ngày sinh, tên đăng nhập…).
- [ ] Không dùng một mật khẩu, kể cả mật khẩu tốt, cho nhiều hệ thống.
- [ ] Bật **chính sách mật khẩu mạnh** trong SQL Server: *Enforce password policy*, *Enforce password expiration*, *User must change password at next login*. Chính sách này lấy theo Local Security Policy của Windows (lịch sử, tuổi tối đa/tối thiểu, độ dài, độ phức tạp).
- [ ] **Ghi log đăng nhập** (Login auditing), nên chọn *Both failed and successful logins*.
- [ ] Định kỳ chạy công cụ dò mật khẩu, ví dụ **SQLDict**, để tự kiểm tra mật khẩu yếu.
- [ ] Lưu mật khẩu trong **trình quản lý mật khẩu**, ví dụ KeePass.

#### 5.6.3 Bảo mật ứng dụng CSDL (mục 6.2)
Ứng dụng web phục vụ nhiều người dùng nhưng thường kết nối CSDL bằng **một hoặc vài tài khoản**. Ví dụ web bán sách: khách xem, tìm kiếm và cho vào giỏ; thành viên đặt hàng, thanh toán và phản hồi; nhân viên quản lý sách và đơn hàng.

Hạn chế khi chỉ phân quyền ở mức ứng dụng:
- CSDL "tin tuyệt đối" ứng dụng, nên mọi lỗ hổng ở ứng dụng trở thành nguy cơ cho CSDL.
- Ứng dụng không kiểm soát được người truy cập CSDL trực tiếp: lập trình viên dùng tài khoản quản trị, quản lý chạy truy vấn trích xuất riêng.

Quy tắc:
- [ ] Kết hợp **phân quyền ở ứng dụng và ở mức CSDL**, không chỉ dựa vào một phía.
- [ ] Có chính sách riêng cho tài khoản của ứng dụng và tài khoản người dùng truy cập CSDL trực tiếp.
- [ ] Đặt **tường lửa giữa web server và DB server** (Internet → Web servers → Firewall → Database server).

Bảo mật hệ thống file của ứng dụng (4 nội dung):
- [ ] **Quyền truy nhập phù hợp:** trang công cộng cho tất cả; trang nội bộ yêu cầu username/password hoặc quản lý theo phiên; **trang quản trị giới hạn thêm theo IP**; thư mục chứa dữ liệu nhạy cảm của OS và web server bị hạn chế truy nhập.
- [ ] **Giữ bí mật mã nguồn** (trừ HTML/CSS), cả mã diễn dịch (PHP, ASP, Perl) lẫn mã biên dịch (C++ EXE/DLL, JSP/Java, ASP.NET).
  - Xóa file backup do trình soạn thảo sinh ra (`.bak`, `.backup`, `.1`, `.2`) trước khi triển khai. Web server không coi chúng là script nên trả nguyên mã nguồn cho trình duyệt.
  - Không để thông tin nhạy cảm trong **chú thích** HTML/mã nguồn. Ví dụ trong slide: `<!-- use username=dev, pwd=c0nt4d0r -->`.
- [ ] **Ẩn thông tin (obscurity)** chỉ là biện pháp bổ sung, **không bao giờ là biện pháp duy nhất**. Ví dụ: cổng không chuẩn (8000, 8080) và URL riêng cho trang quản trị (`admin4963.mysite.com`, `mysite.com/admin4963/`).
- [ ] **Liệt kê và duyệt thư mục:** dùng trang mặc định, hoặc cấm liệt kê và trả trang báo lỗi. Chống chuỗi duyệt thư mục bằng bộ lọc. Hạn chế đọc/ghi file dựa trực tiếp trên tên file người dùng nhập.
- [ ] Định kỳ (hàng ngày/tuần) **quét web log** tìm lỗi **404, 403, 500** rồi khắc phục.

#### 5.6.4 Bảo mật các đối tượng trong CSDL (mục 6.3)
Đối tượng gồm bảng, view, thủ tục, hàm và trigger. Quyền được cấp theo nhóm vai trò (role) hoặc cấp riêng cho từng tài khoản.
- SQL Server **Server roles:** `bulkadmin`, `dbcreator`, `diskadmin`, `processadmin`, `public`, `securityadmin`, `serveradmin`, `setupadmin`, `sysadmin`.
- **Database roles:** `db_accessadmin`, `db_backupoperator`, `db_datareader`, `db_datawriter`, `db_ddladmin`, `db_denydatareader`, `db_denydatawriter`, `db_owner`, `db_securityadmin`, `public`.
- 3 lệnh quản lý quyền:
  - `GRANT <quyền> ON <đối tượng> TO <người dùng>`: cấp quyền.
  - `DENY <quyền> ON <đối tượng> TO <người dùng>`: từ chối.
  - `REVOKE <quyền> ON <đối tượng> FROM <người dùng>`: hủy quyền do GRANT hoặc DENY tạo ra.
- Các loại quyền: `EXECUTE` (thủ tục, hàm, trigger); `SELECT/INSERT/UPDATE/DELETE` (bảng, view); `CREATE/ALTER/DROP` (hầu hết đối tượng).

Quy tắc:
- [ ] Tài khoản ứng dụng **không** thuộc `sysadmin` hay `db_owner`; chỉ gán role tối thiểu, ví dụ `db_datareader` cộng `EXECUTE` trên các thủ tục cần dùng.
- [ ] Dùng `DENY` cho các thao tác cấm tuyệt đối; thu hồi bằng `REVOKE` khi không còn cần.
- [ ] Không cấp `CREATE/ALTER/DROP` cho tài khoản ứng dụng (cũng giúp chống Trojan trong thủ tục, xem §5.4).

#### 5.6.5 Mã hóa trong CSDL (mục 6.4)
Hai kỹ thuật:
- **Mã hóa (encryption):** thường dùng khóa đối xứng (DES, 3DES, **AES**, RC2, RC4) vì khóa nhỏ và nhanh.
- **Băm (hashing):** một chiều, không giải mã được (MD2/4/5, SHA1/2/3); thường dùng cho **mật khẩu**.

Mã hóa tốn CPU và bộ nhớ, nên cần chọn **phương pháp** và **phần dữ liệu cần mã hóa** (chỉ dữ liệu nhạy cảm hay toàn bộ) theo chính sách bảo mật.

| Mức mã hóa | Cách làm | Ưu / nhược điểm |
| --- | --- | --- |
| **Dữ liệu trong bảng** (6.4.2) | Dùng hàm mã hóa của DBMS (DBMS cũ không có, DBMS mới hỗ trợ hạn chế) **hoặc mã hóa tại lớp ứng dụng** (thư viện API mạnh) | Khó lập chỉ mục và tìm kiếm; tăng tải DB hoặc app server |
| **Toàn bộ dữ liệu – TDE** (6.4.3) | Tự mã hóa từng khối khi ghi, giải mã khi đọc vào bộ nhớ. Hỗ trợ trên SQL Server, Oracle, MySQL, DB2. Oracle: Master Key nằm trong keystore ngoài, Table Keys trong Data Dictionary | Trong suốt với người dùng; **nhưng ai truy cập được CSDL vẫn đọc dữ liệu bình thường**, nên TDE không chống người có quyền truy nhập; tăng tải |
| **Trên đường truyền** (6.4.4) | **SSL/TLS** (giữa tầng TCP và ứng dụng; chứng chỉ số của bên thứ 3 tin cậy, khóa công khai để trao đổi khóa phiên, MAC/HMAC cho toàn vẹn); **IPSec** (tầng IP, tạo đường hầm, dùng trong VPN) | Tốn tài nguyên và tăng lượng dữ liệu truyền, nên **chỉ dùng khi client và DB server không cùng LAN** |
| **Thiết bị lưu trữ đặc biệt** (6.4.5) | HDD/RAID hỗ trợ mã hóa, thực hiện ở mức BIOS/OS | Trong suốt; nhược điểm giống TDE |

Quy tắc:
- [ ] **Mật khẩu người dùng: băm** (chọn SHA-2/SHA-3, không dùng MD5/SHA1 đã yếu) kèm salt (xem §2.4). **Dữ liệu nhạy cảm cần đọc lại** (số thẻ, CMND…): mã hóa đối xứng AES.
- [ ] Ưu tiên mã hóa cột nhạy cảm tại lớp ứng dụng; bật TDE để bảo vệ file dữ liệu và bản sao lưu bị lấy cắp.
- [ ] Nhớ TDE và mã hóa ổ đĩa **không thay thế** phân quyền: vẫn phải áp quyền tối thiểu.
- [ ] Bật TLS/IPSec khi app server và DB server khác mạng LAN.

#### 5.6.6 Biện pháp khác (mục 6.5)
- [ ] **Bảo vệ chuỗi kết nối CSDL.** Chuỗi kết nối thường nằm ở file text và chứa cả `UID`/`PWD`, ví dụ `...Server=192.168.0.10;Database=CustomersDB;UID=test_user;PWD=Abc123456;`. Phải **mã hóa chuỗi kết nối** và không để lộ trong mã nguồn hay repo.
- [ ] **Tường lửa CSDL:** lọc truy vấn bằng phần cứng hoặc phần mềm, đặt giữa người dùng/ứng dụng và DB server. Hợp lệ thì chuyển tiếp; độc hại thì chặn, cảnh báo, ghi log, hoặc thay thế (Allow / Log / Alert / Substitute / Block). Kết hợp được với kiểm toán (Audit Vault).
  - Ưu điểm: lọc tập trung cho nhiều client và nhiều DB server; **không phải sửa mã ứng dụng**.
  - Nhược điểm: giảm hiệu năng do phải phân tích cú pháp SQL và chạy tập luật.
  - MySQL Firewall hoạt động theo **whitelist**: câu SQL có trong whitelist được cho qua, còn lại bị chặn (chống SQLi).

#### 5.6.7 Mô hình bảo mật SQL Server / MySQL / Oracle (mục 6.6)
- **SQL Server:** 2 khâu là **xác thực đăng nhập** (login authentication) và **kiểm tra quyền** (verify permissions) cho mọi hành động trong CSDL. Luồng: kết nối mạng → xác thực login → chuyển vào database → kiểm tra quyền từng thao tác. Quyền đi theo chuỗi Principal → Role → Permissions → Object. Có 2 nhóm role: **Server roles** (do CSDL `master` quản lý) và **Database roles** (cố định / người dùng tạo / `public`), cộng quyền trên đối tượng (Grant/Revoke/Deny).
- **MySQL:** mô hình gồm Privilege Management (xác thực qua Linux/LDAP, Windows AD, Custom, Proxy Users; phân quyền đến database và object); Encryption (SSL/TLS, khóa công khai/bí mật, chữ ký số); Firewall & Auditing (chặn mối đe dọa, tuân thủ, kiểm toán đăng nhập và truy vấn).
- **Oracle:** kiến trúc Instance (SGA, các tiến trình nền PMON/SMON/DBWR/LGWR/CKPT) và Database (datafiles, control files, redo log, **password file**). Mỗi kết nối kích hoạt một *user process*; mỗi phiên kích hoạt một *server process*.
- [ ] Cấu hình bảo mật theo đúng mô hình của DBMS đang dùng: role, xác thực, mã hóa, tường lửa, kiểm toán.

### 5.7 Sao lưu, khôi phục, kiểm toán, giám sát (Chương 7)

#### 5.7.1 Sao lưu & khôi phục dự phòng (mục 7.1)
- **Sao lưu (backup)** là tạo bản sao một phần hoặc toàn bộ CSDL lên cùng phương tiện hoặc phương tiện riêng (đĩa cứng, băng từ, ổ mạng, đám mây), định kỳ hoặc không định kỳ.
- **Khôi phục (restore)** là phục hồi CSDL từ bản sao sau sự cố.
- Vai trò: chủ động đối phó sự cố, bảo đảm **tính sẵn dùng và toàn vẹn**.

3 loại sự cố cần chuẩn bị:
1. **Sự cố DBMS (Instance failures):** lỗi bên trong DBMS hoặc lỗi OS.
2. **Sự cố ứng dụng/giao dịch:** lỗi xử lý dữ liệu.
3. **Sự cố phương tiện lưu trữ (Media failures):** hỏng đĩa cứng, RAID, băng từ.

Các dạng sao lưu:
- Theo **đối tượng**: sao lưu CSDL, sao lưu **log giao dịch**, sao lưu **file** (một file hoặc một nhóm file; các kiểu Full / Partial / Differential).
- Theo **mức độ**:
  - **Full:** toàn bộ dữ liệu, thường dùng cho lần đầu. Tốn thời gian và dung lượng.
  - **Incremental/Differential:** chỉ phần thay đổi. Nhanh và ít dung lượng, nhưng khôi phục có thể lâu hơn.

**Mô hình khôi phục của SQL Server:**

| Mô hình | Log giao dịch | Khôi phục được |
| --- | --- | --- |
| **Simple** | Tối thiểu, **không sao lưu log** | Không theo trang hay theo thời điểm; theo file chỉ giới hạn ở file dữ liệu thứ cấp chỉ đọc |
| **Full** | Ghi đầy đủ, có sao lưu log | **Mọi kiểu: theo thời điểm, theo trang, theo file** |
| **Bulk_log** | Như Full, nhưng thao tác theo mẻ chỉ ghi log tối thiểu | Như Full, **trừ khôi phục theo thời điểm** khi có thao tác ghi log tối thiểu |

Thực hiện sao lưu:
- Qua giao diện quản trị hoặc dòng lệnh, ví dụ `BACKUP DATABASE test_db TO DISK = 'D:\backups\test_db.bak'` (thêm `WITH DIFFERENTIAL` cho sao lưu phần thay đổi).
- Đặt tên file theo thời gian.
- Tự động hóa bằng **Maintenance Plan / Schedule jobs** (SQL Server) hoặc công cụ lập lịch của DBMS khác.

Quy tắc sao lưu:
- [ ] Sao lưu **định kỳ**; chọn tần suất theo yêu cầu an toàn dữ liệu, khả năng của phương tiện lưu trữ và tải hệ thống lúc sao lưu.
- [ ] **Kết hợp sao lưu tại chỗ (on-site) và ra ngoài (off-site).**
- [ ] Dùng mô hình **Full** cho CSDL quan trọng và **sao lưu log giao dịch định kỳ**, vừa để khôi phục theo thời điểm, vừa để khống chế kích thước file log.
- [ ] Trong tùy chọn sao lưu: bật *Verify backup when finished* và *Perform checksum before writing to media*.

#### 5.7.2 An toàn dữ liệu sao lưu (mục 7.1.3)
- [ ] **Dọn dẹp file sao lưu:** ghi đè, hoặc tạo file mới và xóa file cũ (ví dụ *Remove files older than 1 week*) để giữ dung lượng đĩa trống tối thiểu.
- [ ] **Đặt mật khẩu cho file sao lưu và phương tiện lưu trữ** để tránh bị khôi phục ngẫu nhiên, ví dụ `BACKUP DATABASE YourDB TO DISK='D:\YourDB.bak' WITH MEDIANAME='...', PASSWORD='...', FORMAT`.
- [ ] **Mã hóa file sao lưu:** LiteSpeed, Red Gate SQL HyperBac, hoặc TDE. Có thể nén kết hợp mã hóa để giảm kích thước.
- [ ] **Off-site backup** (chống sự cố toàn tòa nhà hay thành phố) phải được bảo vệ, vì file có thể bị đánh cắp:
  - Mã hóa file.
  - **Mã hóa đường truyền** đến nơi lưu.
  - Dùng **nhân viên tin cậy** khi vận chuyển ổ đĩa hoặc băng từ.
  - Ví dụ trong slide: Oracle RMAN → Secure Backup Cloud Module → Amazon S3, có nén và mã hóa.

#### 5.7.3 Khôi phục CSDL (mục 7.1.4)
- Nguồn khôi phục: bản sao lưu toàn bộ, file sao lưu, file log giao dịch.
- Việc này khó, đòi hỏi quản trị viên có kiến thức và kinh nghiệm.
- 3 kiểu khôi phục:
  - **Full recovery.**
  - **Partial recovery:** đến một thời điểm.
  - **Transactional recovery:** chi tiết theo giao dịch, cần công cụ bên thứ 3.
- Tùy chọn của lệnh `RESTORE DATABASE ... WITH RECOVERY | NORECOVERY | STANDBY`:
  - `RECOVERY`: sẵn sàng dùng, không khôi phục thêm log được.
  - `NORECOVERY`: tiếp tục khôi phục log.
  - `STANDBY`: chỉ đọc, có thể hoàn tác.
- Các tùy chọn khác: `WITH REPLACE`, `RESTRICTED_USER`.
- [ ] **Kiểm tra sau khôi phục**: dữ liệu phải đầy đủ và chính xác.
- [ ] **Diễn tập khôi phục định kỳ**. Một bản sao lưu chưa từng khôi phục thử thì chưa chắc dùng được.

#### 5.7.4 Kiểm toán CSDL (mục 7.2.1–7.2.2)
Kiểm toán trả lời câu hỏi **"Ai đã làm gì, trên dữ liệu nào, khi nào và bằng cách nào?"** (*Who did what to which data, when and how?*). Nó giúp truy tìm nguyên nhân sự cố; phải giám sát **liên tục** và xem xét **định kỳ**.

2 cách thu thập:
- **Tại chỗ, trên từng DB server:** dùng tính năng của DBMS. Chỉ hợp với hệ thống nhỏ và vừa; độ an toàn thấp.
- **Tập trung trên hệ thống kiểm toán độc lập:** hợp với hệ thống lớn, ít ảnh hưởng DB server. Sự kiện được đưa khỏi máy bị giám sát (nơi dễ bị sửa) sang máy do kiểm toán viên kiểm soát.
- Công cụ phổ biến: **ApexSQL Audit**, **Zabbix**.

**7 dạng kiểm toán, cần bật đủ:**

| Dạng kiểm toán | Ghi gì / cách làm |
| --- | --- |
| 1. **Đăng nhập/đăng xuất** | Username, IP máy khách, tên ứng dụng, thời gian, thành công hay thất bại. Dùng Login auditing của DBMS, hoặc tự viết trigger `AFTER LOGON ON DATABASE` / `BEFORE LOGOFF ON DATABASE` ghi vào bảng `user_login_audit`. Thấy đăng nhập sai nhiều lần thì **tạm khóa tài khoản** |
| 2. **Nguồn sử dụng CSDL** | IP, tên ứng dụng, nút mạng kết nối đến CSDL; câu lệnh SQL đã chạy (SELECT/INSERT/DROP/GRANT…) |
| 3. **Hoạt động DDL** | Thay đổi schema hoặc cấu trúc bảng. Dùng tính năng của DBMS, hệ thống kiểm toán độc lập, hoặc **so sánh snapshot schema** |
| 4. **Lỗi CSDL** | Lỗi phát sinh khi thao tác. Ví dụ: ký tự đặc biệt gây lỗi câu SQL là **dấu hiệu dò SQLi**, từ đó tìm ra lỗ hổng chèn mã |
| 5. **Thay đổi mã nguồn thủ tục/hàm/trigger** | Ai sửa, nội dung gì, khi nào. Dùng công cụ quản lý mã nguồn có change tracking hoặc audit của DBMS |
| 6. **Thay đổi đặc quyền & thông tin truy nhập** | Thêm/xóa user, login, role; thay đổi ánh xạ login–user–role; thay đổi đặc quyền; **đổi mật khẩu**; thay đổi thuộc tính an ninh ở mức server, CSDL, lệnh, đối tượng |
| 7. **Thay đổi dữ liệu nhạy cảm** | Lưu cả **bản ghi trước và sau khi thay đổi**. Chỉ bật khi thật cần, vì **log có thể làm rò rỉ dữ liệu nhạy cảm** và dữ liệu phát sinh rất lớn |

#### 5.7.5 Giám sát hoạt động CSDL – DAM (mục 7.2.3)
**DAM** theo Gartner là tập công cụ nhận dạng và thông báo hành vi gian lận, bất hợp pháp hoặc không mong muốn đối với CSDL, với ảnh hưởng tối thiểu đến hệ thống. DAM cung cấp: khám phá và phân loại dữ liệu, quản lý quyền truy nhập, giám sát người dùng đặc quyền, chống mất mát dữ liệu.

Tính năng tối thiểu của hệ thống DAM:
- [ ] Giám sát và kiểm toán **độc lập** mọi hoạt động, gồm cả hoạt động của **người quản trị** và các giao dịch SQL.
- [ ] **Lưu dữ liệu giám sát an toàn ra máy chủ bên ngoài** CSDL được giám sát.
- [ ] Tổng hợp và tương quan hoạt động từ nhiều DBMS.
- [ ] Bảo đảm **một tài khoản dịch vụ chỉ truy cập một CSDL, từ một IP xác định, và chỉ chạy một nhóm nhỏ truy vấn được cấp phép**. Nhờ vậy dễ cảnh báo truy vấn trái phép.
- [ ] **Phân chia nhiệm vụ:** giám sát và ghi log hoạt động của chính DBA.
- [ ] Sinh **cảnh báo** khi vi phạm chính sách (dựa trên luật hoặc kinh nghiệm).

**5 điều nên làm:**
1. Dùng giải pháp **dựa trên agent** để thu thập, giữ mức tiêu thụ CPU và đĩa ở **1–3%**.
2. Giám sát **liên tục, thời gian thực** lưu lượng SQL cục bộ; tùy chọn giám sát cả SQL từ mạng.
3. Khi chặn phiên, gửi thông báo ngắt TCP như thể máy khách mất mạng, để CSDL không bị thay đổi và kết nối được dọn dẹp bình thường.
4. Tiêu thụ **băng thông tối thiểu**: chỉ câu SQL kèm ít siêu dữ liệu (thời gian đáp ứng, số bản ghi trả về).
5. Có **giao diện đồ họa đơn nhất** để xử lý sự cố nhanh.

**5 điều không nên làm:**
1. Không cài bất kỳ đối tượng nào vào CSDL được giám sát: không script, không tạo thêm tài khoản (trừ tài khoản vận hành).
2. Không thay đổi file cấu hình, tham số hay bản thân CSDL; agent không thao tác trên CSDL.
3. Không yêu cầu khởi động lại máy chủ (trừ trường hợp đặc biệt).
4. Không yêu cầu tài khoản CSDL mới hoặc có sẵn để cài đặt, giám sát hay ngăn chặn.
5. Không ghi vào hệ thống file (trừ khi mất kết nối đến cổng mạng).

#### 5.7.6 Kiểm tra, đánh giá bảo mật hệ thống CSDL (mục 7.2.4)
- Đánh giá phải làm **liên tục theo chu kỳ**, rồi dùng kết quả để điều chỉnh biện pháp bảo mật.
- Mô hình **IBM Guardium** có 4 khâu:
  1. **Discover & Classify:** tìm CSDL và dữ liệu nhạy cảm.
  2. **Assess & Harden:** đánh giá lỗ hổng, cấu hình, hành vi; khóa cấu hình và theo dõi thay đổi.
  3. **Monitor & Enforce:** phát hiện bất thường, ngăn chặn thời gian thực, tích hợp SIEM.
  4. **Audit & Report:** báo cáo tuân thủ, kho kiểm toán an toàn, lưu trữ dài hạn.

**Checklist đánh giá (theo MiCORE Solutions):**
- [ ] **Tài khoản người dùng CSDL:** vô hiệu hóa tài khoản ngầm định không dùng; không còn tài khoản mang **mật khẩu mặc định của nhà cung cấp**; rà vai trò và đặc quyền; tuân thủ chính sách tài khoản; quản lý hồ sơ người dùng.
- [ ] **Chính sách mật khẩu:** mật khẩu mạnh; thuộc tính lịch sử, độ dài, tuổi thọ, khóa mật khẩu.
- [ ] **Thủ tục kiểm toán CSDL.**
- [ ] **Thủ tục vận hành.**
- [ ] **Di chuyển & làm mới dữ liệu** (data migration/refresh).
- [ ] **Cấu hình CSDL.**
- [ ] **Bản vá bảo mật** của DBMS.
- [ ] **Cơ chế kiểm soát truy nhập.**

---

## 6. Checklist triển khai cuối cùng (bản gộp — rà trước khi lên production)

**Mạng/hạ tầng**
- [ ] Firewall + IDS/IPS; DB server trong mạng nội bộ, không mở ra Internet.
- [ ] HTTPS + HSTS cho toàn site; TLS giữa app server và DB.

**Máy chủ web**
- [ ] Hardening: đổi/khóa tài khoản mặc định, gỡ nội dung mẫu, cấm liệt kê thư mục, khóa HTTP method thừa, tắt thông báo lỗi chi tiết.
- [ ] Cập nhật bản vá OS/web server/DBMS/thư viện (chống "Vulnerable & Outdated Components").
- [ ] Thư mục upload không có quyền thực thi; chống path traversal.

**Ứng dụng**
- [ ] Kiểm tra đầu vào ở server (kích thước/định dạng/nội dung).
- [ ] Tham số hóa mọi truy vấn SQL; dùng stored procedure.
- [ ] Escaping đầu ra + CSP (chống XSS); anti-CSRF token + SameSite.
- [ ] Kiểm tra quyền trên mỗi yêu cầu (chống Broken Access Control #1 OWASP 2021).
- [ ] Không tin dữ liệu bất biến phía client (chống logic attack).
- [ ] Xác minh toàn vẹn khi cập nhật phần mềm/dữ liệu/CI-CD (chống A08:2021).
- [ ] Nếu fetch tài nguyên theo URL người dùng: **whitelist + kiểm tra URL** (chống SSRF A10:2021).

**Xác thực & phiên**
- [ ] Mật khẩu băm có salt; đa nhân tố cho tài khoản quan trọng.
- [ ] Token phiên ngẫu nhiên, HTTPS-only, cookie `HttpOnly`+`Secure`+`SameSite`, timeout, hủy khi đăng xuất.
- [ ] Ngưỡng khóa + CAPTCHA chống vét cạn.

**Dữ liệu & CSDL**
- [ ] Tài khoản DB của app quyền tối thiểu (không sa/root); tắt thủ tục hệ thống nguy hiểm.
- [ ] Mã hóa dữ liệu nhạy cảm (cột/TDE) + mã hóa đường truyền; đổi mật khẩu DB mặc định; tắt tính năng DBMS không dùng.
- [ ] Xác thực DB: không dùng "trusted client"; ưu tiên xác thực qua OS; mật khẩu DB ≥ 10 ký tự, đủ 4 loại ký tự, bật password policy/expiration.
- [ ] Tài khoản app không thuộc `sysadmin`/`db_owner`; chỉ role tối thiểu + `EXECUTE` thủ tục; dùng `DENY`/`REVOKE`.
- [ ] **Mã hóa chuỗi kết nối CSDL**; không để mật khẩu DB trong mã nguồn, comment hay repo.
- [ ] Tường lửa giữa web server và DB server; cân nhắc tường lửa CSDL (whitelist truy vấn).
- [ ] Xóa file `.bak`, `.backup`, `.1`, `.2` và comment nhạy cảm trước khi deploy; trang quản trị giới hạn theo IP.
- [ ] Sao lưu định kỳ (Full + Differential + log giao dịch, mô hình Full recovery), on-site + off-site, **đặt mật khẩu và mã hóa** file sao lưu, mã hóa đường truyền off-site; bật verify/checksum; **diễn tập khôi phục**.
- [ ] Ngưỡng tài nguyên CSDL: giới hạn truy vấn/phút, timeout truy vấn lớn, giới hạn kết nối đồng thời (chống DoS vào CSDL).
- [ ] Thủ tục/hàm chỉ được tạo, sửa trên máy chủ development rồi quản trị viên triển khai; lưu phiên bản và giám sát việc thực thi (chống Trojan trên CSDL).

**Ghi log & giám sát**
- [ ] Ghi log ở mọi lớp, log tập trung, bảo vệ log khỏi bị xóa (chống A09:2021 Logging & Monitoring Failures).
- [ ] Bật đủ 7 dạng kiểm toán CSDL (§5.7.4); lưu log kiểm toán ra máy chủ ngoài CSDL; quét web log tìm 404/403/500 định kỳ.
- [ ] DAM: tài khoản dịch vụ chỉ truy cập 1 CSDL từ 1 IP với nhóm truy vấn được phép; giám sát cả DBA.
- [ ] Đánh giá bảo mật CSDL định kỳ theo checklist §5.7.6.
- [ ] Cảnh báo hành vi bất thường; có kế hoạch phản ứng sự cố.

**Quy trình**
- [ ] Threat modeling ở pha thiết kế; phân tích tĩnh (SAST) + động (DAST)/pentest trước phát hành; Final Security Review.

---

## 7. Ánh xạ OWASP Top 10 (2021) → mục trong tài liệu này

| OWASP 2021 | Quy tắc tương ứng |
| --- | --- |
| A01 Broken Access Control | §2.5, §3.2, §5.6.4, §6 (kiểm tra quyền mỗi yêu cầu, least privilege, GRANT/DENY/REVOKE) |
| A02 Cryptographic Failures | §2.4, §4.4, §5.6 (băm mật khẩu, mã hóa dữ liệu/đường truyền, quản lý khóa) |
| A03 Injection (gồm XSS) | §2.1, §2.3 |
| A04 Insecure Design | §0, §4.1, §4.5 (bảo mật từ thiết kế, threat modeling, SDL) |
| A05 Security Misconfiguration | §3.1, §5.5, §5.6.3, §5.7.6 (hardening, gỡ mặc định, xóa file backup, đánh giá cấu hình) |
| A06 Vulnerable & Outdated Components | §3.1, §6 (cập nhật bản vá & thư viện) |
| A07 Identification & Authentication Failures | §2.4, §3.2, §3.3, §5.6.1–5.6.2 |
| A08 Software & Data Integrity Failures | §6 (xác minh toàn vẹn cập nhật/CI-CD) |
| A09 Security Logging & Monitoring Failures | §2.7, §4.4, §5.7.4–5.7.5, §6 |
| A10 SSRF | §6 (whitelist + kiểm tra URL khi fetch tài nguyên) |

---

### Nguồn
- *Bài giảng An toàn ứng dụng web và CSDL* — TS. Hoàng Xuân Dậu, bản 2021 (157 trang), Chương 1–7. Lấy từ Google Drive lớp.
- Slide môn học — ThS. Phan Nghĩa Hiệp (Chương 1–7), Google Classroom; slide Chương 5, 6, 7 đọc trực tiếp.
- Chương 1–7: theo nội dung giáo trình và slide. Riêng mục top 10 lỗ hổng CSDL (§5.5) mới xác nhận được 5/10 mục từ danh mục hình.
