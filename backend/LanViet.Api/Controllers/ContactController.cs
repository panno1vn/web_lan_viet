using LanViet.Api.Data;
using LanViet.Api.Dtos;
using LanViet.Api.Models;
using LanViet.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LanViet.Api.Controllers;

/// <summary>Lời nhắn liên hệ: khách gửi (POST), quản trị viên xem (GET) và xóa (DELETE).</summary>
[Route("api/contact")]
public class ContactController(AppDbContext db, AuditService audit) : ApiControllerBase
{
    /// <summary>POST /api/contact - gửi lời nhắn.</summary>
    [HttpPost]
    [EnableRateLimiting(RateLimits.Contact)]
    public async Task<IActionResult> Send(ContactRequest req)
    {
        db.ContactMessages.Add(new ContactMessage
        {
            Name = req.Name.Trim(),
            Email = req.Email.Trim().ToLowerInvariant(),
            Message = req.Message.Trim(),
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        return StatusCode(201, new { message = "Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm." });
    }

    /// <summary>GET /api/contact - danh sách lời nhắn (quản trị viên).</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        NoStore();
        var messages = await db.ContactMessages.AsNoTracking()
            .OrderByDescending(m => m.Id).Take(200)
            .Select(m => new ContactMessageDto(m.Id, m.Name, m.Email, m.Message, m.CreatedAt))
            .ToListAsync();
        return Ok(new { messages });
    }

    /// <summary>DELETE /api/contact/{id} - xóa lời nhắn đã xử lý (quản trị viên).</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int:min(1)}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await db.ContactMessages.Where(m => m.Id == id).ExecuteDeleteAsync();
        if (deleted == 0) return Error(404, "Không tìm thấy lời nhắn.");
        await audit.LogAsync("contact_deleted", details: new { id });
        return NoContent();
    }
}
