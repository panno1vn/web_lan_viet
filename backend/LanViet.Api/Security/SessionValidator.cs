using System.Security.Claims;
using LanViet.Api.Data;
using LanViet.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace LanViet.Api.Security;

public static class ClaimNames
{
    public const string Stamp = "lanviet:stamp";
    public const string LoginAt = "lanviet:login_at";
}

public static class ClaimsExtensions
{
    public static int? GetUserId(this ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public static ClaimsPrincipal CreatePrincipal(User u, long loginAt)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
            new Claim(ClaimTypes.Role, u.Role),
            new Claim(ClaimNames.Stamp, u.SecurityStamp),
            new Claim(ClaimNames.LoginAt, loginAt.ToString()),
        ], CookieAuthenticationDefaults.AuthenticationScheme);
        return new ClaimsPrincipal(identity);
    }
}

/// <summary>
/// Chạy ở MỖI request có cookie đăng nhập (§2.5, §3.3):
///  - user không còn tồn tại, hoặc SecurityStamp đã đổi (đăng xuất, đổi mật khẩu, đăng nhập nơi khác) => hủy phiên
///  - quá thời hạn tuyệt đối 8 giờ kể từ lúc đăng nhập => hủy phiên
///  - quyền (role) luôn lấy lại từ CSDL: người bị hạ quyền mất quyền ngay, không phải chờ hết phiên
/// </summary>
public static class SessionValidator
{
    public static readonly TimeSpan AbsoluteTimeout = TimeSpan.FromHours(8);

    public static async Task ValidateAsync(CookieValidatePrincipalContext ctx)
    {
        var principal = ctx.Principal;
        var userId = principal?.GetUserId();
        var stamp = principal?.FindFirstValue(ClaimNames.Stamp);
        _ = long.TryParse(principal?.FindFirstValue(ClaimNames.LoginAt), out var loginAt);

        var expired = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(loginAt) > AbsoluteTimeout;
        User? user = null;
        if (userId is not null && !expired)
        {
            var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        }

        if (user is null || user.SecurityStamp != stamp)
        {
            ctx.RejectPrincipal();
            await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }

        if (!principal!.IsInRole(user.Role))
        {
            ctx.ReplacePrincipal(ClaimsExtensions.CreatePrincipal(user, loginAt));
            ctx.ShouldRenew = true;
        }
    }
}
