using System.Text.Json;
using LanViet.Api.Data;
using LanViet.Api.Models;

namespace LanViet.Api.Security;

/// <summary>
/// Ghi nhật ký sự kiện bảo mật vào bảng AuditLogs (A09:2021, §5.7.4). Bảng này có trigger
/// cấm UPDATE/DELETE (xem migration AddSecurityTriggers). KHÔNG ghi mật khẩu/token vào log.
/// Dùng DbContext riêng để log vẫn được lưu kể cả khi request chính lỗi/rollback.
/// </summary>
public class AuditService(IServiceScopeFactory scopes, IHttpContextAccessor http, ILogger<AuditService> logger)
{
    public async Task LogAsync(string evt, int? userId = null, object? details = null)
    {
        var ctx = http.HttpContext;
        userId ??= ctx?.User.GetUserId();
        var entry = new AuditLog
        {
            Event = evt,
            UserId = userId,
            Ip = ctx?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Truncate(ctx?.Request.Headers.UserAgent.ToString(), 200),
            Details = details is null ? null : Truncate(JsonSerializer.Serialize(details), 1000),
            CreatedAt = DateTime.UtcNow,
        };
        logger.LogInformation("[audit] {Event} user={UserId} ip={Ip} {Details}", evt, userId, entry.Ip, entry.Details);
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AuditLogs.Add(entry);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Không ghi được audit log");
        }
    }

    private static string? Truncate(string? s, int max) => s is null ? null : s.Length <= max ? s : s[..max];
}
