using System.ComponentModel.DataAnnotations;
using LanViet.Api.Models;
using LanViet.Api.Security;

namespace LanViet.Api.Dtos;

// DTO tách biệt dữ liệu nhận từ client với entity trong CSDL -> client không gán được các trường
// như Role, Price của đơn hàng, Stock... (chống mass assignment). JSON có trường lạ sẽ bị từ chối.

// ===== Xác thực =====
public record RegisterRequest(
    [Required(ErrorMessage = "Vui lòng nhập họ tên.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Họ tên cần từ 2 đến 80 ký tự.")]
    [RegularExpression(Patterns.PersonName, ErrorMessage = "Họ tên chỉ gồm chữ cái.")]
    string FullName,

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [StringLength(254)]
    [RegularExpression(Patterns.Email, ErrorMessage = "Email không hợp lệ.")]
    string Email,

    [StrongPassword] string Password,

    [Required(ErrorMessage = "Vui lòng nhập mã xác nhận.")]
    [RegularExpression("^[0-9]{1,4}$", ErrorMessage = "Mã xác nhận không đúng.")]
    string Captcha,

    [Required(ErrorMessage = "Mã xác nhận đã hết hạn.")]
    [StringLength(500)]
    string CaptchaToken);

public record LoginRequest(
    [Required, StringLength(254)] string Email,
    [Required, StringLength(200)] string Password);

public record ChangePasswordRequest(
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")][StringLength(200)] string CurrentPassword,
    [StrongPassword] string NewPassword);

public record UpdateProfileRequest(
    [Required(ErrorMessage = "Vui lòng nhập họ tên.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Họ tên cần từ 2 đến 80 ký tự.")]
    [RegularExpression(Patterns.PersonName, ErrorMessage = "Họ tên chỉ gồm chữ cái.")]
    string FullName);

public record UserDto(int Id, string Email, string FullName, string Role)
{
    public static UserDto From(User u) => new(u.Id, u.Email, u.FullName, u.Role);
}

// ===== Sản phẩm =====
public record ProductDto(int Id, string Slug, string Name, string Species, string Description, string Care,
    int Price, int Stock, string Color, string Accent, bool Featured)
{
    public static ProductDto From(Product p) =>
        new(p.Id, p.Slug, p.Name, p.Species, p.Description, p.Care, p.Price, p.Stock, p.Color, p.Accent, p.Featured);
}

/// <summary>Dữ liệu quản trị viên gửi lên khi thêm (POST) hoặc sửa (PUT) sản phẩm.</summary>
public record ProductInput(
    [Required(ErrorMessage = "Vui lòng nhập slug.")]
    [StringLength(80)]
    [RegularExpression(Patterns.Slug, ErrorMessage = "Slug chỉ gồm chữ thường không dấu, số và dấu gạch nối.")]
    string Slug,

    [Required(ErrorMessage = "Vui lòng nhập tên sản phẩm.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên cần từ 2 đến 100 ký tự.")]
    [SafeText] string Name,

    [Required(ErrorMessage = "Vui lòng nhập dòng lan.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Dòng lan cần từ 2 đến 50 ký tự.")]
    [SafeText] string Species,

    [Required(ErrorMessage = "Vui lòng nhập mô tả.")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Mô tả cần từ 10 đến 1000 ký tự.")]
    [SafeText(multiline: true)] string Description,

    [Required(ErrorMessage = "Vui lòng nhập cách chăm sóc.")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Cách chăm sóc cần từ 5 đến 500 ký tự.")]
    [SafeText(multiline: true)] string Care,

    [Range(1000, 100_000_000, ErrorMessage = "Giá phải từ 1.000 đến 100.000.000 ₫.")] int Price,
    [Range(0, 10_000, ErrorMessage = "Tồn kho phải từ 0 đến 10.000.")] int Stock,

    [Required, RegularExpression(Patterns.HexColor, ErrorMessage = "Màu phải có dạng #RRGGBB.")] string Color,
    [Required, RegularExpression(Patterns.HexColor, ErrorMessage = "Màu phải có dạng #RRGGBB.")] string Accent,
    bool Featured);

// ===== Đơn hàng =====
public record OrderLineInput(
    [Range(1, int.MaxValue, ErrorMessage = "Sản phẩm không hợp lệ.")] int ProductId,
    [Range(1, 20, ErrorMessage = "Số lượng mỗi sản phẩm từ 1 đến 20.")] int Quantity);

public record CreateOrderRequest(
    [Required, MinLength(1, ErrorMessage = "Giỏ hàng trống."), MaxLength(20, ErrorMessage = "Tối đa 20 sản phẩm.")]
    List<OrderLineInput> Items,

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
    [RegularExpression(Patterns.Phone, ErrorMessage = "Số điện thoại không hợp lệ.")]
    string Phone,

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ.")]
    [StringLength(200, MinimumLength = 10, ErrorMessage = "Địa chỉ cần từ 10 đến 200 ký tự.")]
    [SafeText] string Address,

    [StringLength(300, ErrorMessage = "Ghi chú tối đa 300 ký tự.")]
    [SafeText(multiline: true)] string? Note);

public record UpdateOrderStatusRequest(
    [Required, RegularExpression("^(pending|shipping|done|cancelled)$", ErrorMessage = "Trạng thái không hợp lệ.")]
    string Status);

public record OrderSummaryDto(int Id, int Total, string Status, DateTime CreatedAt);

public record OrderDetailDto(int Id, int Total, string Status, string Phone, string Address, string Note, DateTime CreatedAt);

public record OrderItemDto(string Name, string Slug, int Quantity, int UnitPrice);

// ===== Liên hệ =====
public record ContactRequest(
    [Required(ErrorMessage = "Vui lòng nhập họ tên.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Họ tên cần từ 2 đến 80 ký tự.")]
    [RegularExpression(Patterns.PersonName, ErrorMessage = "Họ tên chỉ gồm chữ cái.")]
    string Name,

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [StringLength(254)]
    [RegularExpression(Patterns.Email, ErrorMessage = "Email không hợp lệ.")]
    string Email,

    [Required(ErrorMessage = "Vui lòng nhập nội dung.")]
    [StringLength(2000, MinimumLength = 10, ErrorMessage = "Nội dung cần từ 10 đến 2000 ký tự.")]
    [SafeText(multiline: true)] string Message);

public record ContactMessageDto(int Id, string Name, string Email, string Message, DateTime CreatedAt);
