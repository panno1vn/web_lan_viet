using LanViet.Api.Models;

namespace LanViet.Api.Data;

// Dữ liệu sản phẩm mẫu, được đưa vào CSDL qua migration (HasData).
// KHÔNG seed tài khoản người dùng/quản trị mặc định (§2.4, §3.1).
public static class SeedData
{
    public static readonly Product[] Products =
    [
        new() { Id = 1, Slug = "ho-diep-trang-ngoc", Name = "Hồ điệp Trắng Ngọc", Species = "Hồ điệp", Description = "Chậu hồ điệp 3 cành hoa trắng tinh khôi, phù hợp trưng bày phòng khách, văn phòng hoặc làm quà tân gia.", Care = "Tưới 1 lần/tuần, đặt nơi có ánh sáng tán xạ, tránh nắng gắt trực tiếp.", Price = 1250000, Stock = 12, Color = "#f7f3f8", Accent = "#e8c547", Featured = true },
        new() { Id = 2, Slug = "ho-diep-tim-hoang-gia", Name = "Hồ điệp Tím Hoàng Gia", Species = "Hồ điệp", Description = "Sắc tím đậm sang trọng, cánh hoa dày, giữ hoa bền từ 2 đến 3 tháng.", Care = "Giữ nhiệt độ 20–28°C, tưới khi giá thể khô mặt.", Price = 1450000, Stock = 8, Color = "#8e3c9e", Accent = "#f2d16b", Featured = true },
        new() { Id = 3, Slug = "dendro-hong-phan", Name = "Dendro Hồng Phấn", Species = "Dendrobium", Description = "Dendro thân cao, chùm hoa hồng phấn dày đặc, rất dễ chăm cho người mới.", Care = "Ưa sáng, tưới 2–3 lần/tuần vào mùa nóng.", Price = 420000, Stock = 25, Color = "#e48fb4", Accent = "#fff1a8", Featured = true },
        new() { Id = 4, Slug = "cattleya-do-ruou", Name = "Cattleya Đỏ Rượu", Species = "Cattleya", Description = "Được mệnh danh \"nữ hoàng các loài lan\", hoa to, cánh lượn sóng, hương thơm nhẹ.", Care = "Cần nhiều sáng, để khô ráo giữa các lần tưới.", Price = 890000, Stock = 6, Color = "#9b1d3a", Accent = "#f4c430", Featured = true },
        new() { Id = 5, Slug = "vanda-xanh-lam", Name = "Vanda Xanh Lam", Species = "Vanda", Description = "Vanda rễ khí sinh, hoa xanh lam hiếm có với vân lưới đặc trưng.", Care = "Phun ẩm rễ mỗi ngày, treo nơi thoáng gió.", Price = 760000, Stock = 10, Color = "#5a6fd6", Accent = "#ffffff", Featured = false },
        new() { Id = 6, Slug = "mokara-cam-hoang-hon", Name = "Mokara Cam Hoàng Hôn", Species = "Mokara", Description = "Mokara cam rực rỡ, ra hoa quanh năm, rất hợp cắm bình.", Care = "Ưa nắng, tưới đều đặn, bón phân loãng hằng tuần.", Price = 380000, Stock = 30, Color = "#f08a3c", Accent = "#ffe08a", Featured = false },
        new() { Id = 7, Slug = "lan-hai-dom-vang", Name = "Lan Hài Đốm Vàng", Species = "Lan hài", Description = "Lan hài có túi môi độc đáo, lá đốm đẹp, loài lan quý cho người sưu tầm.", Care = "Ưa bóng râm, giữ giá thể ẩm nhưng không úng.", Price = 1150000, Stock = 4, Color = "#d9a521", Accent = "#6b3e1f", Featured = false },
        new() { Id = 8, Slug = "oncidium-vu-nu", Name = "Oncidium Vũ Nữ", Species = "Oncidium", Description = "Chùm hoa vàng nhỏ như những vũ nữ đang múa, mang lại may mắn ngày Tết.", Care = "Ánh sáng vừa phải, tưới khi giá thể gần khô.", Price = 320000, Stock = 40, Color = "#f5d000", Accent = "#a0522d", Featured = false },
    ];
}
