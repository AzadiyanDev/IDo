using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IDo.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UserCalendarType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Settings_CalendarType",
                schema: "IDo",
                table: "UserProfiles",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Gregorian");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Settings_CalendarType",
                schema: "IDo",
                table: "UserProfiles");
        }
    }
}
