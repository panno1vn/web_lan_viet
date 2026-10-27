using System.Security.Claims;
using System.Security.Cryptography;
using LanViet.Api.Data;
using LanViet.Api.Dtos;
using LanViet.Api.Models;
using LanViet.Api.Security;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LanViet.Api.Controllers;

/// <summary>Đăng ký, đăng nhập, đăng xuất, hồ sơ, đổi mật khẩu (§2.4, §3.2, §3.3).</summary>
[Route("api")]
public class AuthController(AppDbContext db, AuditService audit, CaptchaService captcha, IAntiforgery antiforgery)
    : ApiControllerBase
{
    private const int BcryptWorkFactor = 12;
    private const int MaxFailedLogins = 5;
    private static readonly TimeSpan LockDuration = TimeSpan.FromMinutes(15);

    // Hash giả: khi email không tồn tại vẫn chạy bcrypt -> thời gian phản hồi như nhau,
    // kẻ tấn công không dò được email nào đã đăng ký (§2.4)
    private static readonly Lazy<string> DummyHash =
        new(() => BCrypt.Net.BCrypt.HashPassword(Convert.ToHexString(RandomNumberGenerator.GetBytes(16)), BcryptWorkFactor));

    private static string NewStamp() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    /// <summary>GET /api/csrf - cấp anti-forgery token cho SPA (token trong body JSON, không đặt lên URL).</summary>
    [HttpGet("csrf")]
    public IActionResult Csrf()
    {
        NoStore();
        return Ok(new { csrfToken = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    }

    /// <summary>GET /api/captcha - câu hỏi CAPTCHA + token đã mã hóa chứa đáp án.</summary>
    [HttpGet("captcha")]
    public IActionResult Captcha()
    {
        NoStore();
        var (question, token) = captcha.Create();
        return Ok(new { question, token });
    }

    /// <summary>GET /api/auth/me - người dùng đang đăng nhập (hoặc null).</summary>
    [HttpGet("auth/me")]
    public async Task<IActionResult> Me()
    {
        NoStore();
        var id = User.GetUserId();
        var user = id is null ? null : await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        return Ok(new { user = user is null ? null : UserDto.From(user) });
    }

    /// <summary>POST /api/auth/register - tạo tài khoản mới.</summary>
    [HttpPost("auth/register")]
    [EnableRateLimiting(RateLimits.Register)]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (!captcha.Verify(req.CaptchaToken, req.Captcha))
            return Error(400, "Mã xác nhận không đúng hoặc đã hết hạn.", "captcha");

        var email = req.Email.Trim().ToLowerInvariant();
        if (StrongPasswordAttribute.ContainsLoginName(req.Password, email))
            return Error(400, "Mật khẩu không được chứa tên đăng nhập.", "password");

        if (await db.Users.AnyAsync(u => u.Email == email))
            // Thông báo chung chung, không xác nhận email đã tồn tại
            return Error(400, "Không thể đăng ký với thông tin này. Vui lòng kiểm tra lại.");

        var user = new User
        {
            Email = email,
            FullName = req.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, BcryptWorkFactor),
            Role = Roles.Customer,
            SecurityStamp = NewStamp(),
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Error(400, "Không thể đăng ký với thông tin này. Vui lòng kiểm tra lại.");
        }
        await audit.LogAsync("register", user.Id);
        return StatusCode(201, new { message = "Đăng ký thành công. Vui lòng đăng nhập." });
    }

    /// <summary>POST /api/auth/login - đăng nhập, cấp cookie phiên mới.</summary>
    [HttpPost("auth/login")]
    [EnableRateLimiting(RateLimits.Login)]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        const string generic = "Email hoặc mật khẩu không đúng.";
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        var now = DateTime.UtcNow;

        if (user?.LockedUntil > now)
        {
            await audit.LogAsync("login_blocked_locked", user.Id);
            var minutes = (int)Math.Ceiling((user.LockedUntil.Value - now).TotalMinutes);
            return Error(423, $"Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau {minutes} phút.");
        }

        var ok = BCrypt.Net.BCrypt.Verify(req.Password, user?.PasswordHash ?? DummyHash.Value);
        if (user is null || !ok)
        {
            if (user is not null)
            {
                user.FailedLogins++;
                if (user.FailedLogins >= MaxFailedLogins)
                {
                    user.FailedLogins = 0;
                    user.LockedUntil = now.Add(LockDuration);
                    await audit.LogAsync("account_locked", user.Id);
                }
                await db.SaveChangesAsync();
            }
            await audit.LogAsync("login_failed", user?.Id);
            return Error(401, generic);
        }

        // Đổi SecurityStamp => mọi phiên cũ của user này (máy khác, cookie bị đánh cắp) hết hiệu lực:
        // mỗi người dùng chỉ có một phiên đang hoạt động (§3.3)
        user.FailedLogins = 0;
        user.LockedUntil = null;
        user.SecurityStamp = NewStamp();
        await db.SaveChangesAsync();

        var csrfToken = await SignInAsync(user);
        await audit.LogAsync("login_success", user.Id);
        return Ok(new { user = UserDto.From(user), csrfToken });
    }

    /// <summary>POST /api/auth/logout - hủy phiên ở phía máy chủ.</summary>
    [HttpPost("auth/logout")]
    public async Task<IActionResult> Logout()
    {
        var id = User.GetUserId();
        if (id is not null)
        {
            var user = await db.Users.FindAsync(id);
            if (user is not null)
            {
                user.SecurityStamp = NewStamp();   // cookie cũ không dùng lại được kể cả khi bị sao chép
                await db.SaveChangesAsync();
            }
            await audit.LogAsync("logout", id);
        }
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        return Ok(new { ok = true, csrfToken = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    }

    /// <summary>PUT /api/auth/profile - cập nhật họ tên.</summary>
    [Authorize]
    [HttpPut("auth/profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest req)
    {
        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        user.FullName = req.FullName.Trim();
        await db.SaveChangesAsync();
        await audit.LogAsync("profile_updated", user.Id);
        return Ok(new { user = UserDto.From(user), message = "Đã cập nhật thông tin." });
    }

    /// <summary>
    /// PUT /api/auth/password - đổi mật khẩu. BẮT BUỘC đúng mật khẩu hiện tại (bài học case-study §2.7),
    /// sau đó hủy mọi phiên khác và cấp phiên mới.
    /// </summary>
    [Authorize]
    [HttpPut("auth/password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        if (string.IsNullOrEmpty(req.CurrentPassword) || !BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
        {
            await audit.LogAsync("change_password_failed", user.Id);
            return Error(400, "Mật khẩu hiện tại không đúng.", "currentPassword");
        }
        if (StrongPasswordAttribute.ContainsLoginName(req.NewPassword, user.Email))
            return Error(400, "Mật khẩu không được chứa tên đăng nhập.", "newPassword");
        if (BCrypt.Net.BCrypt.Verify(req.NewPassword, user.PasswordHash))
            return Error(400, "Mật khẩu mới phải khác mật khẩu hiện tại.", "newPassword");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, BcryptWorkFactor);
        user.SecurityStamp = NewStamp();
        await db.SaveChangesAsync();

        var csrfToken = await SignInAsync(user);
        await audit.LogAsync("change_password", user.Id);
        return Ok(new { message = "Đổi mật khẩu thành công.", csrfToken });
    }

    /// <summary>Cấp cookie đăng nhập mới và anti-forgery token gắn với danh tính mới.</summary>
    private async Task<string?> SignInAsync(User user)
    {
        var principal = ClaimsExtensions.CreatePrincipal(user, DateTimeOffset.UtcNow.ToUnixTimeSeconds());
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal,
            new AuthenticationProperties { IsPersistent = false });
        HttpContext.User = principal;
        return antiforgery.GetAndStoreTokens(HttpContext).RequestToken;
    }
}
