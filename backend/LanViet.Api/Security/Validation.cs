using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace LanViet.Api.Security;

// Kiểm tra dữ liệu đầu vào phía máy chủ (§0, §1.2): kích thước, định dạng (whitelist), nội dung.

public static partial class Patterns
{
    public const string Email = @"^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,185}\.[A-Za-z]{2,24}$";
    public const string PersonName = @"^\p{L}[\p{L}\p{M} .'-]*$";
    public const string Phone = @"^(0|\+84)[0-9]{9,10}$";
    public const string Slug = @"^[a-z0-9]+(-[a-z0-9]+)*$";
    public const string HexColor = "^#[0-9a-fA-F]{6}$";

    [GeneratedRegex(@"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]")]
    public static partial Regex ControlChars();
}

/// <summary>Chuẩn hóa mọi chuỗi JSON về Unicode NFC trước khi kiểm tra (chống lách bộ lọc bằng mã hóa khác - §2.5).</summary>
public sealed class NfcStringConverter : JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.String
            ? reader.GetString()!.Normalize(NormalizationForm.FormC)
            : throw new JsonException();

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);
}

/// <summary>Không cho phép ký tự điều khiển; mặc định cũng không cho phép xuống dòng.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class SafeTextAttribute(bool multiline = false) : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is not string s) return ValidationResult.Success;
        if (Patterns.ControlChars().IsMatch(s) || (!multiline && (s.Contains('\n') || s.Contains('\r'))))
            return new ValidationResult("Chứa ký tự không hợp lệ.", [context.MemberName!]);
        return ValidationResult.Success;
    }
}

/// <summary>Chính sách mật khẩu: 10–72 byte, đủ chữ thường, chữ hoa, chữ số, ký tự đặc biệt (§2.4, §5.6.2).</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class StrongPasswordAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        var members = new[] { context.MemberName! };
        if (value is not string pw) return new ValidationResult("Vui lòng nhập mật khẩu.", members);
        // bcrypt chỉ dùng 72 byte đầu -> giới hạn để không phần nào của mật khẩu bị bỏ qua
        if (pw.Length < 10 || Encoding.UTF8.GetByteCount(pw) > 72)
            return new ValidationResult("Mật khẩu phải dài từ 10 ký tự (tối đa 72 byte).", members);
        var kinds = (pw.Any(char.IsLower) ? 1 : 0) + (pw.Any(char.IsUpper) ? 1 : 0)
                  + (pw.Any(char.IsDigit) ? 1 : 0) + (pw.Any(c => !char.IsLetterOrDigit(c)) ? 1 : 0);
        return kinds == 4
            ? ValidationResult.Success
            : new ValidationResult("Mật khẩu phải có chữ thường, chữ hoa, chữ số và ký tự đặc biệt.", members);
    }

    public static bool ContainsLoginName(string password, string email)
    {
        var local = email.Split('@')[0];
        return local.Length >= 3 && password.Contains(local, StringComparison.OrdinalIgnoreCase);
    }
}
