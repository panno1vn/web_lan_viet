/*
  Tạo tài khoản SQL Server QUYỀN TỐI THIỂU cho ứng dụng khi triển khai thật (§2.3, §5.6.1–5.6.4).

  - Khi phát triển: ứng dụng dùng Windows Authentication (xem appsettings.Development.json).
  - Khi triển khai: KHÔNG dùng sa / sysadmin / db_owner. Chạy script này bằng tài khoản quản trị
    SAU khi đã tạo CSDL bằng migration (npm run db:update), rồi cấu hình chuỗi kết nối qua biến môi trường:
      ConnectionStrings__Default="Server=...;Database=LanVietShop;User Id=lanviet_app;Password=...;Encrypt=True"

  Thay <MAT_KHAU_MANH> bằng mật khẩu ≥ 10 ký tự, đủ chữ hoa, chữ thường, số, ký tự đặc biệt,
  và KHÔNG commit mật khẩu thật lên GitHub.
*/

USE [master];
GO
CREATE LOGIN [lanviet_app]
    WITH PASSWORD = N'<MAT_KHAU_MANH>',
         DEFAULT_DATABASE = [LanVietShop],
         CHECK_POLICY = ON,          -- áp chính sách mật khẩu của Windows (độ dài, độ phức tạp, khóa)
         CHECK_EXPIRATION = ON;      -- mật khẩu có thời hạn
GO

USE [LanVietShop];
GO
CREATE USER [lanviet_app] FOR LOGIN [lanviet_app];
GO

-- Chỉ đọc/ghi dữ liệu. Không thuộc db_owner, không có quyền DDL (CREATE/ALTER/DROP).
ALTER ROLE [db_datareader] ADD MEMBER [lanviet_app];
ALTER ROLE [db_datawriter] ADD MEMBER [lanviet_app];

-- Cấm tuyệt đối các thao tác không cần thiết (DENY ưu tiên hơn GRANT)
DENY CREATE TABLE, CREATE VIEW, CREATE PROCEDURE, CREATE FUNCTION, CREATE SCHEMA TO [lanviet_app];
DENY ALTER, TAKE OWNERSHIP ON SCHEMA::[dbo] TO [lanviet_app];

-- Nhật ký kiểm toán: ứng dụng chỉ được thêm, không được sửa/xóa (thêm một lớp ngoài trigger)
DENY UPDATE, DELETE ON [dbo].[AuditLogs] TO [lanviet_app];

-- Bảng lịch sử migration chỉ do quản trị viên thay đổi
DENY INSERT, UPDATE, DELETE ON [dbo].[__EFMigrationsHistory] TO [lanviet_app];
GO
