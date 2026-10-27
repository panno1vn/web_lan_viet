using LanViet.Api.Data;
using LanViet.Api.Dtos;
using LanViet.Api.Models;
using LanViet.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LanViet.Api.Controllers;

/// <summary>Đơn hàng của người dùng đang đăng nhập.</summary>
[Authorize]
[Route("api/orders")]
public class OrdersController(AppDbContext db, AuditService audit) : ApiControllerBase
{
    /// <summary>GET /api/orders - đơn hàng của tôi.</summary>
    [HttpGet]
    public async Task<IActionResult> Mine()
    {
        NoStore();
        var orders = await db.Orders.AsNoTracking()
            .Where(o => o.UserId == CurrentUserId)
            .OrderByDescending(o => o.Id).Take(100)
            .Select(o => new OrderSummaryDto(o.Id, o.Total, o.Status, o.CreatedAt))
            .ToListAsync();
        return Ok(new { orders });
    }

    /// <summary>
    /// GET /api/orders/{id} - chi tiết đơn. Luôn lọc theo UserId của phiên =>
    /// không xem được đơn của người khác bằng cách đổi id trên URL (IDOR, OWASP A01).
    /// </summary>
    [HttpGet("{id:int:min(1)}")]
    public async Task<IActionResult> Get(int id)
    {
        NoStore();
        var order = await db.Orders.AsNoTracking()
            .Where(o => o.Id == id && o.UserId == CurrentUserId)
            .Select(o => new
            {
                order = new OrderDetailDto(o.Id, o.Total, o.Status, o.Phone, o.Address, o.Note, o.CreatedAt),
                items = o.Items.Select(i => new OrderItemDto(i.Product!.Name, i.Product.Slug, i.Quantity, i.UnitPrice)).ToList(),
            })
            .FirstOrDefaultAsync();
        return order is null ? Error(404, "Không tìm thấy đơn hàng.") : Ok(order);
    }

    /// <summary>
    /// POST /api/orders - đặt hàng. Client chỉ gửi mã sản phẩm + số lượng; giá và tổng tiền luôn
    /// lấy từ CSDL, KHÔNG tin giá do client gửi (§2.5). Trừ tồn kho trong transaction.
    /// </summary>
    [HttpPost]
    [EnableRateLimiting(RateLimits.Orders)]
    public async Task<IActionResult> Create(CreateOrderRequest req)
    {
        var ids = req.Items.Select(i => i.ProductId).ToList();
        if (ids.Distinct().Count() != ids.Count) return Error(400, "Sản phẩm bị trùng trong giỏ.", "items");

        await using var tx = await db.Database.BeginTransactionAsync();
        var products = await db.Products.Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        var order = new Order
        {
            UserId = CurrentUserId,
            Phone = req.Phone,
            Address = req.Address.Trim(),
            Note = req.Note?.Trim() ?? "",
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        foreach (var line in req.Items)
        {
            if (!products.TryGetValue(line.ProductId, out var p)) return Error(400, "Sản phẩm không tồn tại.", "items");
            // UPDATE ... WHERE Stock >= @qty: nguyên tử, không bán vượt tồn kho kể cả khi nhiều người đặt cùng lúc
            var updated = await db.Products
                .Where(x => x.Id == p.Id && x.Stock >= line.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Stock, x => x.Stock - line.Quantity));
            if (updated != 1) return Error(409, $"\"{p.Name}\" chỉ còn {p.Stock} chậu.", "items");

            order.Items.Add(new OrderItem { ProductId = p.Id, Quantity = line.Quantity, UnitPrice = p.Price });
            order.Total += p.Price * line.Quantity;
        }

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        await tx.CommitAsync();       // lỗi ở bất kỳ bước nào trước đó => rollback toàn bộ

        await audit.LogAsync("order_created", details: new { orderId = order.Id, order.Total });
        return StatusCode(201, new { orderId = order.Id });
    }

    /// <summary>DELETE /api/orders/{id} - hủy đơn của tôi khi còn "Chờ xác nhận", hoàn lại tồn kho.</summary>
    [HttpDelete("{id:int:min(1)}")]
    public async Task<IActionResult> Cancel(int id)
    {
        await using var tx = await db.Database.BeginTransactionAsync();
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == CurrentUserId);
        if (order is null) return Error(404, "Không tìm thấy đơn hàng.");
        if (order.Status != OrderStatus.Pending) return Error(409, "Chỉ hủy được đơn đang chờ xác nhận.");

        order.Status = OrderStatus.Cancelled;
        foreach (var item in order.Items)
        {
            await db.Products.Where(p => p.Id == item.ProductId)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + item.Quantity));
        }
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        await audit.LogAsync("order_cancelled", details: new { orderId = id });
        return Ok(new { message = "Đã hủy đơn hàng." });
    }

    /// <summary>PUT /api/orders/{id}/status - quản trị viên cập nhật trạng thái đơn.</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int:min(1)}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusRequest req)
    {
        var order = await db.Orders.FindAsync(id);
        if (order is null) return Error(404, "Không tìm thấy đơn hàng.");
        if (order.Status is OrderStatus.Cancelled or OrderStatus.Done)
            return Error(409, "Đơn đã kết thúc, không thể đổi trạng thái.");
        if (req.Status == OrderStatus.Cancelled)
            return Error(400, "Hủy đơn phải thực hiện bởi khách hàng.", "status");

        order.Status = req.Status;
        await db.SaveChangesAsync();
        await audit.LogAsync("order_status_updated", details: new { orderId = id, req.Status });
        return Ok(new { message = "Đã cập nhật trạng thái." });
    }

    /// <summary>GET /api/orders/all - quản trị viên xem tất cả đơn hàng gần đây.</summary>
    [Authorize(Roles = Roles.Admin)]
    [HttpGet("all")]
    public async Task<IActionResult> All()
    {
        NoStore();
        var orders = await db.Orders.AsNoTracking()
            .OrderByDescending(o => o.Id).Take(200)
            .Select(o => new { o.Id, o.Total, o.Status, o.CreatedAt, customer = o.User!.FullName, o.Phone, o.Address })
            .ToListAsync();
        return Ok(new { orders });
    }
}
