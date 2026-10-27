using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LanViet.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Event = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Ip = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Details = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Slug = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Species = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Care = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Price = table.Column<int>(type: "int", nullable: false),
                    Stock = table.Column<int>(type: "int", nullable: false),
                    Color = table.Column<string>(type: "char(7)", unicode: false, fixedLength: true, maxLength: 7, nullable: false),
                    Accent = table.Column<string>(type: "char(7)", unicode: false, fixedLength: true, maxLength: 7, nullable: false),
                    Featured = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.CheckConstraint("CK_Products_Price", "[Price] > 0");
                    table.CheckConstraint("CK_Products_Stock", "[Stock] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FailedLogins = table.Column<int>(type: "int", nullable: false),
                    LockedUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.CheckConstraint("CK_Users_FailedLogins", "[FailedLogins] >= 0");
                    table.CheckConstraint("CK_Users_Role", "[Role] IN ('customer', 'admin')");
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Total = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.CheckConstraint("CK_Orders_Status", "[Status] IN ('pending', 'shipping', 'done', 'cancelled')");
                    table.CheckConstraint("CK_Orders_Total", "[Total] > 0");
                    table.ForeignKey(
                        name: "FK_Orders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => new { x.OrderId, x.ProductId });
                    table.CheckConstraint("CK_OrderItems_Quantity", "[Quantity] BETWEEN 1 AND 20");
                    table.CheckConstraint("CK_OrderItems_UnitPrice", "[UnitPrice] > 0");
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "Accent", "Care", "Color", "Description", "Featured", "Name", "Price", "Slug", "Species", "Stock" },
                values: new object[,]
                {
                    { 1, "#e8c547", "Tưới 1 lần/tuần, đặt nơi có ánh sáng tán xạ, tránh nắng gắt trực tiếp.", "#f7f3f8", "Chậu hồ điệp 3 cành hoa trắng tinh khôi, phù hợp trưng bày phòng khách, văn phòng hoặc làm quà tân gia.", true, "Hồ điệp Trắng Ngọc", 1250000, "ho-diep-trang-ngoc", "Hồ điệp", 12 },
                    { 2, "#f2d16b", "Giữ nhiệt độ 20–28°C, tưới khi giá thể khô mặt.", "#8e3c9e", "Sắc tím đậm sang trọng, cánh hoa dày, giữ hoa bền từ 2 đến 3 tháng.", true, "Hồ điệp Tím Hoàng Gia", 1450000, "ho-diep-tim-hoang-gia", "Hồ điệp", 8 },
                    { 3, "#fff1a8", "Ưa sáng, tưới 2–3 lần/tuần vào mùa nóng.", "#e48fb4", "Dendro thân cao, chùm hoa hồng phấn dày đặc, rất dễ chăm cho người mới.", true, "Dendro Hồng Phấn", 420000, "dendro-hong-phan", "Dendrobium", 25 },
                    { 4, "#f4c430", "Cần nhiều sáng, để khô ráo giữa các lần tưới.", "#9b1d3a", "Được mệnh danh \"nữ hoàng các loài lan\", hoa to, cánh lượn sóng, hương thơm nhẹ.", true, "Cattleya Đỏ Rượu", 890000, "cattleya-do-ruou", "Cattleya", 6 },
                    { 5, "#ffffff", "Phun ẩm rễ mỗi ngày, treo nơi thoáng gió.", "#5a6fd6", "Vanda rễ khí sinh, hoa xanh lam hiếm có với vân lưới đặc trưng.", false, "Vanda Xanh Lam", 760000, "vanda-xanh-lam", "Vanda", 10 },
                    { 6, "#ffe08a", "Ưa nắng, tưới đều đặn, bón phân loãng hằng tuần.", "#f08a3c", "Mokara cam rực rỡ, ra hoa quanh năm, rất hợp cắm bình.", false, "Mokara Cam Hoàng Hôn", 380000, "mokara-cam-hoang-hon", "Mokara", 30 },
                    { 7, "#6b3e1f", "Ưa bóng râm, giữ giá thể ẩm nhưng không úng.", "#d9a521", "Lan hài có túi môi độc đáo, lá đốm đẹp, loài lan quý cho người sưu tầm.", false, "Lan Hài Đốm Vàng", 1150000, "lan-hai-dom-vang", "Lan hài", 4 },
                    { 8, "#a0522d", "Ánh sáng vừa phải, tưới khi giá thể gần khô.", "#f5d000", "Chùm hoa vàng nhỏ như những vũ nữ đang múa, mang lại may mắn ngày Tết.", false, "Oncidium Vũ Nữ", 320000, "oncidium-vu-nu", "Oncidium", 40 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CreatedAt",
                table: "AuditLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId_Id",
                table: "Orders",
                columns: new[] { "UserId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Slug",
                table: "Products",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "ContactMessages");

            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
