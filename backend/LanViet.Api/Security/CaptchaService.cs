using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Caching.Memory;

namespace LanViet.Api.Security;

/// <summary>
/// CAPTCHA phép cộng đơn giản chống đăng ký tự động (§2.4).
/// Đáp án được mã hóa + ký bằng Data Protection (client không đọc/sửa được), có hạn 5 phút
/// và chỉ dùng được MỘT lần (nonce đã dùng được ghi nhớ trong bộ nhớ đệm).
/// </summary>
public class CaptchaService(IDataProtectionProvider provider, IMemoryCache usedNonces)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);
    private readonly IDataProtector _protector = provider.CreateProtector("LanViet.Captcha.v1");

    public (string Question, string Token) Create()
    {
        var a = RandomNumberGenerator.GetInt32(2, 20);
        var b = RandomNumberGenerator.GetInt32(2, 10);
        var nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
        var expires = DateTimeOffset.UtcNow.Add(Lifetime).ToUnixTimeSeconds();
        var token = _protector.Protect($"{a + b}|{expires}|{nonce}");
        return ($"{a} + {b} = ?", token);
    }

    public bool Verify(string token, string answer)
    {
        string payload;
        try { payload = _protector.Unprotect(token); }
        catch (CryptographicException) { return false; }

        var parts = payload.Split('|');
        if (parts.Length != 3 || !long.TryParse(parts[1], out var expires)) return false;
        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expires) return false;

        var nonce = parts[2];
        if (usedNonces.TryGetValue(nonce, out _)) return false;     // đã dùng rồi
        usedNonces.Set(nonce, true, Lifetime);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(parts[0]), Encoding.UTF8.GetBytes(answer.Trim()));
    }
}
