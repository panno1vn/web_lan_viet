using LanViet.Api.Security;
using Microsoft.AspNetCore.Mvc;

namespace LanViet.Api.Controllers;

public static class RateLimits
{
    public const string Login = "login";
    public const string Register = "register";
    public const string Contact = "contact";
    public const string Orders = "orders";
}

[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>Trả lỗi theo một định dạng thống nhất: { error, field }.</summary>
    protected ObjectResult Error(int status, string message, string? field = null) =>
        StatusCode(status, new { error = message, field });

    protected int CurrentUserId => User.GetUserId() ?? throw new UnauthorizedAccessException();

    /// <summary>Không cho trình duyệt/proxy lưu cache dữ liệu cá nhân.</summary>
    protected void NoStore() => Response.Headers.CacheControl = "no-store";
}
