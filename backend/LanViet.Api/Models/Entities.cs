namespace LanViet.Api.Models;

// Các entity được EF Core ánh xạ thành bảng trong SQL Server.
// Ràng buộc (độ dài, CHECK, UNIQUE, khóa ngoại) khai báo ở Data/AppDbContext.cs.

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public string PasswordHash { get; set; } = "";      // bcrypt - không bao giờ lưu mật khẩu gốc
    public string Role { get; set; } = Roles.Customer;
    public int FailedLogins { get; set; }
    public DateTime? LockedUntil { get; set; }
    // Đổi giá trị này => mọi cookie đăng nhập cũ của user lập tức hết hiệu lực
    public string SecurityStamp { get; set; } = "";
    public DateTime CreatedAt { get; set; }

    public List<Order> Orders { get; set; } = [];
}

public static class Roles
{
    public const string Customer = "customer";
    public const string Admin = "admin";
}

public class Product
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string Species { get; set; } = "";
    public string Description { get; set; } = "";
    public string Care { get; set; } = "";
    public int Price { get; set; }          // VND
    public int Stock { get; set; }
    public string Color { get; set; } = "#c2569b";
    public string Accent { get; set; } = "#f2c94c";
    public bool Featured { get; set; }
}

public static class OrderStatus
{
    public const string Pending = "pending";
    public const string Shipping = "shipping";
    public const string Done = "done";
    public const string Cancelled = "cancelled";
    public static readonly string[] All = [Pending, Shipping, Done, Cancelled];
}

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int Total { get; set; }
    public string Status { get; set; } = OrderStatus.Pending;
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string Note { get; set; } = "";
    public DateTime CreatedAt { get; set; }

    public List<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int Quantity { get; set; }
    public int UnitPrice { get; set; }      // giá tại thời điểm đặt, lấy từ CSDL
}

public class ContactMessage
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class AuditLog
{
    public long Id { get; set; }
    public string Event { get; set; } = "";
    public int? UserId { get; set; }
    public string? Ip { get; set; }
    public string? UserAgent { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}
