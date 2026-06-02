using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IDo.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProjectsCollaborationRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignmentStatus",
                schema: "IDo",
                table: "Tasks",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<Guid>(
                name: "PendingAssigneeUserId",
                schema: "IDo",
                table: "Tasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                schema: "IDo",
                table: "Tasks",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "TaskId",
                schema: "IDo",
                table: "TaskRequests",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                schema: "IDo",
                table: "TaskRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SectionId",
                schema: "IDo",
                table: "TaskRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "IDo",
                table: "TaskRequests",
                type: "nvarchar(240)",
                maxLength: 240,
                nullable: false,
                defaultValue: "Collaboration request");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                schema: "IDo",
                table: "TaskRequests",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "TaskAssignment");

            migrationBuilder.Sql("""
                UPDATE tr
                SET
                    tr.[Type] = 'TaskAssignment',
                    tr.[Title] = CASE
                        WHEN t.[Title] IS NULL OR t.[Title] = '' THEN 'Task assignment'
                        ELSE CONCAT('Task assignment: ', t.[Title])
                    END,
                    tr.[ProjectId] = t.[ProjectId],
                    tr.[SectionId] = t.[SectionId]
                FROM [IDo].[TaskRequests] tr
                LEFT JOIN [IDo].[Tasks] t ON tr.[TaskId] = t.[Id];
                """);

            migrationBuilder.Sql("""
                UPDATE [IDo].[Tasks]
                SET [AssignmentStatus] = 'Accepted'
                WHERE [AssigneeUserId] IS NOT NULL AND [AssignmentStatus] = 'None';
                """);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                schema: "IDo",
                table: "TaskComments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAtUtc",
                schema: "IDo",
                table: "ProjectSections",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignmentStatus",
                schema: "IDo",
                table: "ProjectSections",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.Sql("""
                UPDATE [IDo].[ProjectSections]
                SET [AssignmentStatus] = 'Accepted', [Visibility] = 'AssignedToMember'
                WHERE [AssignedUserId] IS NOT NULL AND [AssignmentStatus] = 'None';
                """);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                schema: "IDo",
                table: "ProjectSections",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                schema: "IDo",
                table: "ProjectSections",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "IDo",
                table: "ProjectSections",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvitedByUserId",
                schema: "IDo",
                table: "ProjectMembers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_PendingAssigneeUserId_AssignmentStatus",
                schema: "IDo",
                table: "Tasks",
                columns: new[] { "PendingAssigneeUserId", "AssignmentStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskRequests_ProjectId_Type_Status",
                schema: "IDo",
                table: "TaskRequests",
                columns: new[] { "ProjectId", "Type", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskRequests_SectionId_ReceiverUserId_Type_Status",
                schema: "IDo",
                table: "TaskRequests",
                columns: new[] { "SectionId", "ReceiverUserId", "Type", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSections_PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections",
                column: "PendingAssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSections_ProjectId_PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections",
                columns: new[] { "ProjectId", "PendingAssignedUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_InvitedByUserId",
                schema: "IDo",
                table: "ProjectMembers",
                column: "InvitedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectMembers_UserProfiles_InvitedByUserId",
                schema: "IDo",
                table: "ProjectMembers",
                column: "InvitedByUserId",
                principalSchema: "IDo",
                principalTable: "UserProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectSections_UserProfiles_PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections",
                column: "PendingAssignedUserId",
                principalSchema: "IDo",
                principalTable: "UserProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskRequests_ProjectSections_SectionId",
                schema: "IDo",
                table: "TaskRequests",
                column: "SectionId",
                principalSchema: "IDo",
                principalTable: "ProjectSections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskRequests_Projects_ProjectId",
                schema: "IDo",
                table: "TaskRequests",
                column: "ProjectId",
                principalSchema: "IDo",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_UserProfiles_PendingAssigneeUserId",
                schema: "IDo",
                table: "Tasks",
                column: "PendingAssigneeUserId",
                principalSchema: "IDo",
                principalTable: "UserProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectMembers_UserProfiles_InvitedByUserId",
                schema: "IDo",
                table: "ProjectMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_ProjectSections_UserProfiles_PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskRequests_ProjectSections_SectionId",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskRequests_Projects_ProjectId",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_UserProfiles_PendingAssigneeUserId",
                schema: "IDo",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_PendingAssigneeUserId_AssignmentStatus",
                schema: "IDo",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_TaskRequests_ProjectId_Type_Status",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropIndex(
                name: "IX_TaskRequests_SectionId_ReceiverUserId_Type_Status",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropIndex(
                name: "IX_ProjectSections_PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropIndex(
                name: "IX_ProjectSections_ProjectId_PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropIndex(
                name: "IX_ProjectMembers_InvitedByUserId",
                schema: "IDo",
                table: "ProjectMembers");

            migrationBuilder.DropColumn(
                name: "AssignmentStatus",
                schema: "IDo",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "PendingAssigneeUserId",
                schema: "IDo",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Priority",
                schema: "IDo",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropColumn(
                name: "SectionId",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropColumn(
                name: "Type",
                schema: "IDo",
                table: "TaskRequests");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                schema: "IDo",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "ArchivedAtUtc",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropColumn(
                name: "AssignmentStatus",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropColumn(
                name: "Color",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropColumn(
                name: "Icon",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropColumn(
                name: "PendingAssignedUserId",
                schema: "IDo",
                table: "ProjectSections");

            migrationBuilder.DropColumn(
                name: "InvitedByUserId",
                schema: "IDo",
                table: "ProjectMembers");

            migrationBuilder.AlterColumn<Guid>(
                name: "TaskId",
                schema: "IDo",
                table: "TaskRequests",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
