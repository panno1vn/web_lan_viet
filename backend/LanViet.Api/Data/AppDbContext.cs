using LanViet.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LanViet.Api.Data;

// EF Core sinh câu SQL có tham số cho mọi truy vấn LINQ -> không nối chuỗi dữ liệu người dùng (chống SQLi - §2.3)
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // Mọi thời điểm lưu ở dạng UTC; khi đọc ra gắn lại Kind=Utc để JSON có hậu tố "Z"
    protected override void ConfigureConventions(ModelConfigurationBuilder c)
    {
        c.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
    }

    private sealed class UtcDateTimeConverter() : Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
        v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Ràng buộc toàn vẹn ở mức CSDL (§5.1) - không chỉ dựa vào kiểm tra ở ứng dụng
        b.Entity<User>(e =>
        {
            e.Property(x => x.Email).HasMaxLength(254).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.FullName).HasMaxLength(80).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(100).IsRequired();
            e.Property(x => x.Role).HasMaxLength(20).IsRequired();
            e.Property(x => x.SecurityStamp).HasMaxLength(64).IsRequired();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Users_Role", "[Role] IN ('customer', 'admin')");
                t.HasCheckConstraint("CK_Users_FailedLogins", "[FailedLogins] >= 0");
            });
        });

        b.Entity<Product>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(80).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Species).HasMaxLength(50).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000).IsRequired();
            e.Property(x => x.Care).HasMaxLength(500).IsRequired();
            e.Property(x => x.Color).HasMaxLength(7).IsFixedLength().IsUnicode(false);
            e.Property(x => x.Accent).HasMaxLength(7).IsFixedLength().IsUnicode(false);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Products_Price", "[Price] > 0");
                t.HasCheckConstraint("CK_Products_Stock", "[Stock] >= 0");
            });
            e.HasData(SeedData.Products);
        });

        b.Entity<Order>(e =>
        {
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(13).IsRequired();
            e.Property(x => x.Address).HasMaxLength(200).IsRequired();
            e.Property(x => x.Note).HasMaxLength(300);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.User).WithMany(u => u.Orders).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.UserId, x.Id });
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Orders_Total", "[Total] > 0");
                t.HasCheckConstraint("CK_Orders_Status", "[Status] IN ('pending', 'shipping', 'done', 'cancelled')");
            });
        });

        b.Entity<OrderItem>(e =>
        {
            e.HasKey(x => new { x.OrderId, x.ProductId });
            e.HasOne(x => x.Order).WithMany(o => o.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_OrderItems_Quantity", "[Quantity] BETWEEN 1 AND 20");
                t.HasCheckConstraint("CK_OrderItems_UnitPrice", "[UnitPrice] > 0");
                // Báo cho EF biết bảng có trigger (tạo ở migration AddSecurityTriggers)
                // để EF không dùng câu lệnh OUTPUT mà SQL Server cấm trên bảng có trigger
                t.HasTrigger("TR_OrderItems_Immutable");
            });
        });

        b.Entity<ContactMessage>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(80).IsRequired();
            e.Property(x => x.Email).HasMaxLength(254).IsRequired();
            e.Property(x => x.Message).HasMaxLength(2000).IsRequired();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        b.Entity<AuditLog>(e =>
        {
            e.Property(x => x.Event).HasMaxLength(50).IsRequired();
            e.Property(x => x.Ip).HasMaxLength(45);
            e.Property(x => x.UserAgent).HasMaxLength(200);
            e.Property(x => x.Details).HasMaxLength(1000);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(x => x.CreatedAt);
            e.ToTable(t => t.HasTrigger("TR_AuditLogs_AppendOnly"));
        });
    }
}
