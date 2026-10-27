using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LanViet.Api.Data.Migrations
{
    /// <summary>
    /// Migration viết tay (migrationBuilder.Sql) để thêm các trigger mà EF Core không tự sinh:
    ///  - AuditLogs chỉ được INSERT, cấm UPDATE/DELETE: kẻ xấu (kể cả admin ác tính) không xóa được dấu vết (§2.7)
    ///  - OrderItems không được sửa sau khi đặt hàng: không đổi được số lượng/giá của đơn cũ (§2.5)
    /// </summary>
    public partial class AddSecurityTriggers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TRIGGER [dbo].[TR_AuditLogs_AppendOnly]
                ON [dbo].[AuditLogs]
                INSTEAD OF UPDATE, DELETE
                AS
                BEGIN
                    SET NOCOUNT ON;
                    THROW 50001, N'AuditLogs is append-only: UPDATE/DELETE is not allowed.', 1;
                END
                """);

            migrationBuilder.Sql("""
                CREATE TRIGGER [dbo].[TR_OrderItems_Immutable]
                ON [dbo].[OrderItems]
                INSTEAD OF UPDATE
                AS
                BEGIN
                    SET NOCOUNT ON;
                    THROW 50002, N'Order items are immutable once the order is placed.', 1;
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS [dbo].[TR_OrderItems_Immutable];");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS [dbo].[TR_AuditLogs_AppendOnly];");
        }
    }
}
