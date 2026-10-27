using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using LanViet.Api.Controllers;
using LanViet.Api.Data;
using LanViet.Api.Models;
using LanViet.Api.Security;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;
var isDev = builder.Environment.IsDevelopment();

// ===== Kết nối CSDL (EF Core + SQL Server) =====
// Chuỗi kết nối KHÔNG nằm trong mã nguồn: Development đọc từ appsettings.Development.json
// (Windows Authentication, không có mật khẩu); Production đọc từ biến môi trường
// ConnectionStrings__Default hoặc user-secrets (§5.6.6).
var connectionString = config.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Thiếu cấu hình ConnectionStrings:Default.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.CommandTimeout(15))); // timeout truy vấn lớn (§5.4)

// Lệnh quản trị: dotnet run -- promote-admin email@example.com
// (không có tài khoản admin mặc định; admin được cấp quyền thủ công cho một tài khoản đã đăng ký)
if (args.Length == 2 && args[0] == "promote-admin")
{
    using var app0 = builder.Build();
    using var scope = app0.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var email = args[1].Trim().ToLowerInvariant();
    var newStamp = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    var n = await db.Users.Where(u => u.Email == email)
        .ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, Roles.Admin).SetProperty(u => u.SecurityStamp, newStamp));
    Console.WriteLine(n == 1 ? $"Đã cấp quyền admin cho {email}. Hãy đăng nhập lại." : $"Không tìm thấy tài khoản {email}.");
    return;
}

// ===== Kestrel: ẩn header Server, giới hạn kích thước request =====
builder.WebHost.ConfigureKestrel(k =>
{
    k.AddServerHeader = false;
    k.Limits.MaxRequestBodySize = 32 * 1024;
});

// ===== Controllers + JSON =====
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new NfcStringConverter());
        // Trường JSON lạ (vd: "price", "role") => 400, không âm thầm bỏ qua (chống mass assignment)
        o.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    })
    .ConfigureApiBehaviorOptions(o =>
    {
        // Lỗi kiểm tra dữ liệu => { error, field } bằng tiếng Việt, không lộ chi tiết nội bộ
        o.InvalidModelStateResponseFactory = ctx =>
        {
            var errors = ctx.ModelState.Where(kv => kv.Value?.Errors.Count > 0).ToList();
            var jsonError = errors.Any(kv => kv.Key.StartsWith('$') || kv.Value!.Errors.Any(e => e.Exception is not null));
            if (jsonError || errors.Count == 0)
                return new BadRequestObjectResult(new { error = "Dữ liệu gửi lên không hợp lệ." });
            var (key, entry) = (errors[0].Key, errors[0].Value!);
            var field = key.Split('.', '[')[^1];
            field = field.Length > 0 ? char.ToLowerInvariant(field[0]) + field[1..] : field;
            return new BadRequestObjectResult(new { error = entry.Errors[0].ErrorMessage, field });
        };
    });

// ===== Xác thực bằng cookie (§3.3) =====
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        // Tiền tố __Host- buộc cookie Secure, Path=/, không có Domain (chỉ dùng khi chạy HTTPS)
        o.Cookie.Name = isDev ? "lanviet.sid" : "__Host-lanviet.sid";
        o.Cookie.HttpOnly = true;                              // JavaScript không đọc được (chống XSS cắp phiên)
        o.Cookie.SameSite = SameSiteMode.Strict;               // chống CSRF
        o.Cookie.SecurePolicy = isDev ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        o.Cookie.Path = "/";
        o.ExpireTimeSpan = TimeSpan.FromMinutes(30);           // hết hạn sau 30 phút không hoạt động
        o.SlidingExpiration = true;
        o.Events.OnValidatePrincipal = SessionValidator.ValidateAsync;
        // API trả 401/403 dạng JSON thay vì chuyển hướng tới trang đăng nhập
        o.Events.OnRedirectToLogin = ctx =>
            Results.Json(new { error = "Vui lòng đăng nhập." }, statusCode: 401).ExecuteAsync(ctx.HttpContext);
        o.Events.OnRedirectToAccessDenied = ctx =>
            Results.Json(new { error = "Bạn không có quyền thực hiện thao tác này." }, statusCode: 403).ExecuteAsync(ctx.HttpContext);
    });
builder.Services.AddAuthorization();

// ===== Chống CSRF: anti-forgery token (§2.2) =====
builder.Services.AddAntiforgery(o =>
{
    o.HeaderName = "X-CSRF-Token";
    o.Cookie.Name = isDev ? "lanviet.af" : "__Host-lanviet.af";
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = isDev ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});

// ===== Giới hạn tần suất (chống vét cạn, spam, DoS lớp ứng dụng - §2.4, §5.4) =====
static string ClientIp(HttpContext ctx) => ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
static RateLimitPartition<string> Fixed(HttpContext ctx, int limit, TimeSpan window) =>
    RateLimitPartition.GetFixedWindowLimiter(ClientIp(ctx), _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = limit, Window = window, QueueLimit = 0,
    });

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        ctx.Request.Path.StartsWithSegments("/api")
            ? Fixed(ctx, 300, TimeSpan.FromMinutes(15))
            : RateLimitPartition.GetNoLimiter("static"));
    o.AddPolicy(RateLimits.Login, ctx => Fixed(ctx, 10, TimeSpan.FromMinutes(15)));
    o.AddPolicy(RateLimits.Register, ctx => Fixed(ctx, 5, TimeSpan.FromHours(1)));
    o.AddPolicy(RateLimits.Contact, ctx => Fixed(ctx, 5, TimeSpan.FromHours(1)));
    o.AddPolicy(RateLimits.Orders, ctx => Fixed(ctx, 20, TimeSpan.FromHours(1)));
    o.OnRejected = async (ctx, token) =>
    {
        await ctx.HttpContext.RequestServices.GetRequiredService<AuditService>()
            .LogAsync("rate_limited", details: new { path = ctx.HttpContext.Request.Path.Value });
        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Bạn thao tác quá nhiều lần, vui lòng thử lại sau." }, token);
    };
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<AuditService>();
builder.Services.AddSingleton<CaptchaService>();

if (isDev)
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

var trustProxy = config.GetValue<bool>("Security:TrustProxy");
if (trustProxy)
{
    builder.Services.Configure<ForwardedHeadersOptions>(o =>
        o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);
}

var app = builder.Build();

// ===== Pipeline =====
if (trustProxy) app.UseForwardedHeaders();

// Xử lý lỗi tập trung: client chỉ nhận thông báo chung, chi tiết chỉ ghi log máy chủ (§4.4, §4.6)
app.UseExceptionHandler(handler => handler.Run(async ctx =>
{
    await ctx.RequestServices.GetRequiredService<AuditService>()
        .LogAsync("server_error", details: new { path = ctx.Request.Path.Value });
    await Results.Json(new { error = "Đã có lỗi xảy ra. Vui lòng thử lại sau." }, statusCode: 500).ExecuteAsync(ctx);
}));

if (!isDev)
{
    app.UseHsts();                                         // Strict-Transport-Security (§2.6)
    if (config.GetValue<bool>("Security:ForceHttps")) app.UseHttpsRedirection();
}

app.UseSecurityHeaders(isDev);
app.UseAllowedMethods();
app.UseJsonOnlyBodies();

if (isDev)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Production: phục vụ bản build React (thư mục dist/) và trả index.html cho mọi đường dẫn của SPA,
// để truy cập trực tiếp /about-us vẫn hiện đúng trang. Không liệt kê thư mục, không phục vụ dotfiles.
var distPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, config["Spa:DistPath"] ?? "../../dist"));
var serveSpa = !isDev && Directory.Exists(distPath);
if (serveSpa)
{
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(distPath) });
}

app.UseRouting();
app.UseAuthentication();
app.UseCsrfProtection(config.GetSection("Security:AllowedOrigins").Get<string[]>() ?? []);
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();
app.MapFallback("/api/{**rest}", () => Results.Json(new { error = "Không tìm thấy." }, statusCode: 404));
if (serveSpa)
{
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = new PhysicalFileProvider(distPath) });
}

app.Run();
