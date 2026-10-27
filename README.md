# Lan Việt Garden – Website bán hoa lan

Đồ án môn **An toàn ứng dụng web và CSDL**.

| Phần | Công nghệ |
| --- | --- |
| Front-end | ReactJS + Vite, react-router, **Axios** |
| Back-end | **ASP.NET Core 8 Web API** (controllers) |
| CSDL | **SQL Server** qua **Entity Framework Core 8** (code-first, migration) |

Các quy tắc bảo mật áp dụng theo [`quy-tac-trien-khai-web-an-toan.md`](quy-tac-trien-khai-web-an-toan.md).

---

## 1. Chạy project

Yêu cầu: Node.js ≥ 20, .NET SDK 8, SQL Server (Developer/Express) chạy ở `localhost` với Windows Authentication.

```bash
npm run setup     # npm install + cài dotnet-ef (dotnet tool restore) + tạo CSDL bằng migration
npm run dev       # web: http://localhost:3000  ·  API: http://localhost:5080 (Vite proxy /api)
```

Swagger (chỉ bật ở môi trường Development): http://localhost:5080/swagger

Cấp quyền quản trị cho một tài khoản đã đăng ký (không có tài khoản admin mặc định):

```bash
dotnet run --project backend/LanViet.Api -- promote-admin email@cua-ban.vn
```

Chạy bản production (ASP.NET Core phục vụ luôn bản build React ở cổng 3000):

```bash
# Chuỗi kết nối production KHÔNG đặt trong file cấu hình, mà truyền qua biến môi trường:
#   ConnectionStrings__Default="Server=...;Database=LanVietShop;User Id=lanviet_app;Password=...;Encrypt=True"
npm start
```

---

## 2. Back-end ASP.NET Core

```
backend/LanViet.Api/
  Program.cs                 # cấu hình DI, EF Core, cookie auth, antiforgery, rate limit, pipeline middleware
  appsettings.json           # cấu hình chung (KHÔNG có chuỗi kết nối/mật khẩu)
  appsettings.Development.json  # chuỗi kết nối dev dùng Windows Authentication
  Controllers/               # AuthController, ProductsController, OrdersController, ContactController
  Dtos/Dtos.cs               # dữ liệu vào/ra + DataAnnotations để kiểm tra đầu vào
  Models/Entities.cs         # entity: User, Product, Order, OrderItem, ContactMessage, AuditLog
  Data/AppDbContext.cs       # DbContext: bảng, ràng buộc, chỉ mục, seed dữ liệu
  Data/Migrations/           # migration do EF Core sinh ra (+ 1 migration viết tay tạo trigger)
  Security/                  # middleware bảo mật, kiểm tra phiên, CAPTCHA, audit log, validator
database/create-app-login.sql  # tạo tài khoản SQL quyền tối thiểu cho production
```

### Các endpoint

| Method | URL | Quyền | Chức năng |
| --- | --- | --- | --- |
| GET | `/api/csrf` | Mọi người | Lấy anti-forgery token |
| GET | `/api/captcha` | Mọi người | Lấy câu hỏi CAPTCHA |
| GET | `/api/auth/me` | Mọi người | Người dùng hiện tại |
| POST | `/api/auth/register` | Mọi người | Đăng ký |
| POST | `/api/auth/login` | Mọi người | Đăng nhập |
| POST | `/api/auth/logout` | Đã đăng nhập | Đăng xuất |
| PUT | `/api/auth/profile` | Đã đăng nhập | Cập nhật họ tên |
| PUT | `/api/auth/password` | Đã đăng nhập | Đổi mật khẩu |
| GET | `/api/products` (`?featured=true&q=`) | Mọi người | Danh sách / tìm kiếm sản phẩm |
| GET | `/api/products/{slug}` | Mọi người | Chi tiết sản phẩm |
| POST | `/api/products` | Admin | Thêm sản phẩm |
| PUT | `/api/products/{id}` | Admin | Sửa sản phẩm |
| DELETE | `/api/products/{id}` | Admin | Xóa sản phẩm (chưa có đơn hàng) |
| GET | `/api/orders` | Đã đăng nhập | Đơn hàng của tôi |
| GET | `/api/orders/{id}` | Chủ đơn | Chi tiết đơn |
| POST | `/api/orders` | Đã đăng nhập | Đặt hàng |
| DELETE | `/api/orders/{id}` | Chủ đơn | Hủy đơn đang chờ xác nhận |
| GET | `/api/orders/all` | Admin | Tất cả đơn hàng |
| PUT | `/api/orders/{id}/status` | Admin | Cập nhật trạng thái đơn |
| POST | `/api/contact` | Mọi người | Gửi lời nhắn |
| GET | `/api/contact` | Admin | Danh sách lời nhắn |
| DELETE | `/api/contact/{id}` | Admin | Xóa lời nhắn |

---

## 3. Front-end gọi API bằng Axios

- [`src/api/client.js`](src/api/client.js): tạo một `axios.create({ baseURL: '/api', withCredentials: true })` với 2 interceptor.
  - **Request interceptor:** tự gắn header `X-CSRF-Token` cho POST/PUT/DELETE.
  - **Response interceptor:** lưu token mới; nếu token hết hạn thì lấy token mới và gửi lại; chuẩn hóa lỗi thành `ApiError`.
- [`src/api/services.js`](src/api/services.js): các hàm theo tài nguyên, dùng đúng phương thức của Axios.

```js
productApi.list()                    // http.get('/products')
productApi.create(product)           // http.post('/products', product)
productApi.update(id, product)       // http.put(`/products/${id}`, product)
productApi.remove(id)                // http.delete(`/products/${id}`)
```

Trang [`/quan-tri`](src/pages/Admin.jsx) (chỉ admin) dùng đủ GET/POST/PUT/DELETE. Trang tài khoản dùng PUT (đổi tên, đổi mật khẩu); trang chi tiết đơn dùng DELETE (hủy đơn).

Ở môi trường dev, Vite (cổng 3000) chuyển tiếp `/api` sang ASP.NET Core (cổng 5080) – xem [`vite.config.js`](vite.config.js). Front-end và API vì vậy cùng origin, không cần bật CORS.

---

## 4. Kết nối CSDL & EF Core

### 4.1 Cài đặt EF Core

```bash
cd backend/LanViet.Api
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.11   # provider SQL Server
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.11      # cần cho lệnh migration
dotnet new tool-manifest            # (ở thư mục gốc repo) tạo .config/dotnet-tools.json
dotnet tool install dotnet-ef --version 8.0.11
```

### 4.2 Cấu hình kết nối

`appsettings.Development.json` dùng **Windows Authentication**, nên không có mật khẩu nào nằm trong repo (§5.6.1, §5.6.6):

```json
"ConnectionStrings": {
  "Default": "Server=localhost;Database=LanVietShop;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True"
}
```

`Program.cs` đăng ký DbContext:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"), sql => sql.CommandTimeout(15)));
```

Ở production, `appsettings.json` để trống chuỗi kết nối; giá trị thật truyền qua biến môi trường `ConnectionStrings__Default`.

### 4.3 Migration

| Việc | Lệnh |
| --- | --- |
| Tạo migration mới sau khi sửa entity/DbContext | `npm run db:migration -- TenMigration` (hoặc `dotnet ef migrations add TenMigration -o Data/Migrations`) |
| Áp migration vào CSDL | `npm run db:update` (hoặc `dotnet ef database update`) |
| Xem danh sách migration | `dotnet ef migrations list` |
| Kiểm tra model có thay đổi chưa tạo migration | `dotnet ef migrations has-pending-model-changes` |
| Quay về migration trước | `dotnet ef database update TenMigrationTruoc` |

Các migration trong project:

1. **`InitialCreate`** – EF Core tự sinh: 6 bảng, khóa chính/ngoại, `UNIQUE`, `CHECK`, chỉ mục, 8 sản phẩm mẫu (`HasData`).
2. **`AddSecurityTriggers`** – viết tay bằng `migrationBuilder.Sql(...)`.
   - Trigger cấm `UPDATE`/`DELETE` bảng `AuditLogs`.
   - Trigger cấm sửa `OrderItems` sau khi đặt hàng.

---

## 5. Các quy tắc bảo mật đã áp dụng

Số mục (§) theo file quy tắc.

| Quy tắc | Cách làm |
| --- | --- |
| §0, §1.2 Kiểm tra đầu vào ở máy chủ | DTO + DataAnnotations (`Required`, `StringLength`, `RegularExpression`, `Range`) và validator tự viết `StrongPassword`, `SafeText`. Chuỗi được chuẩn hóa Unicode NFC trước khi kiểm tra. JSON có trường lạ bị từ chối (`UnmappedMemberHandling.Disallow`) để chống mass assignment. Body chỉ nhận JSON, tối đa 32 KB. |
| §2.1 XSS | React tự escape; không dùng `dangerouslySetInnerHTML`. CSP chặt (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`). Cookie `HttpOnly`. |
| §2.2 CSRF | Anti-forgery token của ASP.NET Core (gắn với danh tính người dùng) gửi qua header `X-CSRF-Token`. Kiểm tra header `Origin`. Cookie `SameSite=Strict`. GET không thay đổi dữ liệu. |
| §2.3 SQL Injection | EF Core/LINQ luôn sinh câu SQL có tham số. Tìm kiếm dùng `EF.Functions.Like` và escape ký tự đại diện. |
| §2.4 Xác thực | bcrypt (cost 12). Mật khẩu ≥ 10 ký tự, đủ 4 loại ký tự, không chứa tên đăng nhập. Sai 5 lần thì khóa 15 phút, kèm rate limit theo IP. CAPTCHA mã hóa bằng Data Protection, hạn 5 phút, dùng một lần. Thông báo lỗi chung chung; dùng hash giả để thời gian phản hồi như nhau. Không có tài khoản mặc định. |
| §2.5 Lỗi logic | Giá/tổng tiền tính ở máy chủ. Trừ tồn kho bằng `UPDATE ... WHERE Stock >= qty` trong transaction. Trigger cấm sửa `OrderItems`. Quyền (role) đọc lại từ CSDL ở mỗi request. |
| §2.6 Trình duyệt | HSTS (production), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP. Không bật CORS. `AllowedHosts` giới hạn Host header. |
| §2.7 Case-study | Đổi mật khẩu bắt buộc mật khẩu hiện tại. `AuditLogs` chỉ cho thêm (trigger + `DENY` cho tài khoản ứng dụng). |
| §3.1 Máy chủ web | Chỉ cho phép GET/HEAD/POST/PUT/DELETE (các phương thức khác trả 405). Tắt header `Server`. Swagger chỉ có ở Development. Không liệt kê thư mục. |
| §3.3 Phiên | Cookie auth của ASP.NET Core (ticket mã hóa). `HttpOnly` + `SameSite=Strict` + `Secure` + tiền tố `__Host-` ở production. Hết hạn sau 30 phút không hoạt động, tối đa 8 giờ. `SecurityStamp` đổi khi đăng nhập/đăng xuất/đổi mật khẩu: mỗi người một phiên, cookie cũ (kể cả bị đánh cắp) mất hiệu lực ngay. |
| §3.4 Hệ thống file | `.gitignore` loại `bin/`, `obj/`, `.env`, file CSDL, `*.bak`… Build không xuất source map. |
| §4.4 Xử lý ngoại lệ | `UseExceptionHandler`: client chỉ nhận thông báo chung; chi tiết ghi log máy chủ. |
| §5.1 Toàn vẹn | `CHECK`, `UNIQUE`, khóa ngoại `RESTRICT`, transaction. |
| §5.4 DoS | Rate limit: chung 300 request/15 phút; đăng nhập, đăng ký, liên hệ, đặt hàng có giới hạn riêng. Timeout truy vấn 15 giây. Giới hạn số dòng trả về. |
| §5.6.1 Xác thực CSDL | Dev dùng Windows Authentication (xác thực qua hệ điều hành, khuyến nghị của Microsoft). |
| §5.6.4 Quyền đối tượng | [`database/create-app-login.sql`](database/create-app-login.sql): tài khoản ứng dụng chỉ có `db_datareader` + `db_datawriter`, `DENY` các lệnh DDL và `DENY UPDATE/DELETE` trên `AuditLogs`. API đơn hàng luôn lọc theo `UserId` (chống IDOR). |
| §5.6.6 Chuỗi kết nối | Không có mật khẩu trong repo; production truyền qua biến môi trường. |
| §5.7.4 Kiểm toán | Bảng `AuditLogs`: đăng ký, đăng nhập thành công/thất bại, khóa tài khoản, đổi mật khẩu, thao tác admin, đặt/hủy đơn, lỗi CSRF, rate limit, lỗi máy chủ. |
| A06 Thành phần lỗi thời | `npm run audit` kiểm tra cả gói npm và gói NuGet có lỗ hổng. |
