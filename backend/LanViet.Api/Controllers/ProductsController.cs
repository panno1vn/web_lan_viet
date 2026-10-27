using LanViet.Api.Data;
using LanViet.Api.Dtos;
using LanViet.Api.Models;
using LanViet.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LanViet.Api.Controllers;

/// <summary>
/// Sản phẩm. Ai cũng xem được (GET); chỉ quản trị viên được thêm (POST), sửa (PUT), xóa (DELETE).
/// Quyền được kiểm tra ở máy chủ trên MỖI request (§2.5, OWASP A01).
/// </summary>
[Route("api/products")]
public class ProductsController(AppDbContext db, AuditService audit) : ApiControllerBase
{
    /// <summary>GET /api/products?featured=true&amp;q=... - danh sách sản phẩm.</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool featured = false, [FromQuery] string? q = null)
    {
        var query = db.Products.AsNoTracking();
        if (featured) query = query.Where(p => p.Featured);
        if (!string.IsNullOrWhiteSpace(q))
        {
            if (q.Length > 60) return Error(400, "Từ khóa tối đa 60 ký tự.", "q");
            // EF.Functions.Like với tham số + escape ký tự đại diện -> an toàn trước SQLi
            var pattern = "%" + q.Trim().Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]") + "%";
            query = query.Where(p => EF.Functions.Like(p.Name, pattern) || EF.Functions.Like(p.Species, pattern));
        }
        var products = await query
            .OrderByDescending(p => p.Featured).ThenBy(p => p.Id)
            .Take(100)                                     // giới hạn kết quả, chống truy vấn nặng (§5.4)
            .ToListAsync();
        return Ok(new { products = products.Select(ProductDto.From) });
    }

    /// <summary>GET /api/products/{slug} - chi tiết một sản phẩm.</summary>
    [HttpGet("{slug:regex(^[[a-z0-9-]]{{1,80}}$)}")]
    public async Task<IActionResult> Get(string slug)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug);
        return product is null ? Error(404, "Không tìm thấy sản phẩm.") : Ok(new { product = ProductDto.From(product) });
    }

    /// <summary>POST /api/products - thêm sản phẩm (quản trị viên).</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<IActionResult> Create(ProductInput input)
    {
        if (await db.Products.AnyAsync(p => p.Slug == input.Slug))
            return Error(409, "Slug đã tồn tại.", "slug");

        var product = new Product();
        Apply(product, input);
        db.Products.Add(product);
        await db.SaveChangesAsync();
        await audit.LogAsync("product_created", details: new { product.Id, product.Slug });
        return CreatedAtAction(nameof(Get), new { slug = product.Slug }, new { product = ProductDto.From(product) });
    }

    /// <summary>PUT /api/products/{id} - cập nhật toàn bộ thông tin sản phẩm (quản trị viên).</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int:min(1)}")]
    public async Task<IActionResult> Update(int id, ProductInput input)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return Error(404, "Không tìm thấy sản phẩm.");
        if (await db.Products.AnyAsync(p => p.Slug == input.Slug && p.Id != id))
            return Error(409, "Slug đã tồn tại.", "slug");

        Apply(product, input);
        await db.SaveChangesAsync();
        await audit.LogAsync("product_updated", details: new { product.Id, product.Slug, product.Price, product.Stock });
        return Ok(new { product = ProductDto.From(product) });
    }

    /// <summary>DELETE /api/products/{id} - xóa sản phẩm chưa có đơn hàng (quản trị viên).</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int:min(1)}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return Error(404, "Không tìm thấy sản phẩm.");
        // Giữ nguyên lịch sử đơn hàng: sản phẩm đã bán thì không xóa được (khóa ngoại RESTRICT)
        if (await db.OrderItems.AnyAsync(i => i.ProductId == id))
            return Error(409, "Sản phẩm đã có trong đơn hàng, không thể xóa. Hãy đặt tồn kho về 0 để ngừng bán.");

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        await audit.LogAsync("product_deleted", details: new { id, product.Slug });
        return NoContent();
    }

    private static void Apply(Product p, ProductInput i)
    {
        p.Slug = i.Slug;
        p.Name = i.Name.Trim();
        p.Species = i.Species.Trim();
        p.Description = i.Description.Trim();
        p.Care = i.Care.Trim();
        p.Price = i.Price;
        p.Stock = i.Stock;
        p.Color = i.Color.ToLowerInvariant();
        p.Accent = i.Accent.ToLowerInvariant();
        p.Featured = i.Featured;
    }
}
