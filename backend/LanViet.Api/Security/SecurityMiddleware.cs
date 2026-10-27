using Microsoft.AspNetCore.Antiforgery;

namespace LanViet.Api.Security;

public static class SecurityMiddleware
{
    private static readonly HashSet<string> AllowedMethods =
        new(["GET", "HEAD", "POST", "PUT", "DELETE"], StringComparer.OrdinalIgnoreCase);

    /// <summary>HTTP security headers (§2.1, §2.6): CSP, chống clickjacking, nosniff, Referrer-Policy...</summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app, bool isDevelopment) =>
        app.Use(async (ctx, next) =>
        {
            var h = ctx.Response.Headers;
            // Swagger UI (chỉ có ở môi trường Development) cần script inline nên không áp CSP strict cho nó
            if (!(isDevelopment && ctx.Request.Path.StartsWithSegments("/swagger")))
            {
                h.ContentSecurityPolicy =
                    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
                    "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; " +
                    "form-action 'self'; frame-ancestors 'none'";
            }
            h.XFrameOptions = "DENY";
            h.XContentTypeOptions = "nosniff";
            h["Referrer-Policy"] = "strict-origin-when-cross-origin";
            h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
            h["Cross-Origin-Opener-Policy"] = "same-origin";
            h["Cross-Origin-Resource-Policy"] = "same-origin";
            await next();
        });

    /// <summary>Chỉ cho phép các phương thức cần dùng; khóa TRACE, OPTIONS, PATCH, COPY, MOVE... (§3.1)</summary>
    public static IApplicationBuilder UseAllowedMethods(this IApplicationBuilder app) =>
        app.Use(async (ctx, next) =>
        {
            if (!AllowedMethods.Contains(ctx.Request.Method))
            {
                ctx.Response.Headers.Allow = "GET, HEAD, POST, PUT, DELETE";
                await Results.Json(new { error = "Phương thức không được hỗ trợ." }, statusCode: 405).ExecuteAsync(ctx);
                return;
            }
            await next();
        });

    /// <summary>API chỉ nhận body dạng JSON; mọi định dạng khác (form, XML...) bị từ chối với 415.</summary>
    public static IApplicationBuilder UseJsonOnlyBodies(this IApplicationBuilder app) =>
        app.Use(async (ctx, next) =>
        {
            var req = ctx.Request;
            var hasBody = req.ContentLength > 0 || req.Headers.TransferEncoding.Count > 0;
            if (hasBody && req.Path.StartsWithSegments("/api") && !req.HasJsonContentType())
            {
                await Results.Json(new { error = "Chỉ chấp nhận dữ liệu JSON." }, statusCode: 415).ExecuteAsync(ctx);
                return;
            }
            await next();
        });

    /// <summary>
    /// Chống CSRF (§2.2) cho mọi request thay đổi dữ liệu tới /api:
    ///  1. header Origin (nếu có) phải nằm trong danh sách cho phép
    ///  2. anti-forgery token (header X-CSRF-Token) phải khớp cookie token và gắn với đúng người dùng
    /// </summary>
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder app, string[] allowedOrigins) =>
        app.Use(async (ctx, next) =>
        {
            var method = ctx.Request.Method;
            var unsafeMethod = HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method);
            if (unsafeMethod && ctx.Request.Path.StartsWithSegments("/api"))
            {
                var audit = ctx.RequestServices.GetRequiredService<AuditService>();
                var origin = ctx.Request.Headers.Origin.ToString();
                if (origin.Length > 0 && !allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                {
                    await audit.LogAsync("csrf_bad_origin", details: new { origin = origin[..Math.Min(origin.Length, 100)], path = ctx.Request.Path.Value });
                    await Results.Json(new { error = "Nguồn yêu cầu không hợp lệ." }, statusCode: 403).ExecuteAsync(ctx);
                    return;
                }

                var antiforgery = ctx.RequestServices.GetRequiredService<IAntiforgery>();
                if (!await antiforgery.IsRequestValidAsync(ctx))
                {
                    await audit.LogAsync("csrf_invalid_token", details: new { path = ctx.Request.Path.Value });
                    await Results.Json(new { error = "Phiên làm việc đã hết hạn, vui lòng tải lại trang.", code = "CSRF" }, statusCode: 403)
                        .ExecuteAsync(ctx);
                    return;
                }
            }
            await next();
        });
}
