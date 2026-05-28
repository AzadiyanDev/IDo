using IDo.Application.DTOs;
using IDo.Domain.Enums;

namespace IDo.Application.Common.Validation;

public sealed class RequestValidationException(IReadOnlyCollection<string> errors) : Exception(string.Join("; ", errors))
{
    public IReadOnlyCollection<string> Errors { get; } = errors;
}

public static class RequestValidators
{
    public static void Validate(CreateTaskRequest request)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors.Add("Task title is required.");
        if (request.ReminderAtUtc.HasValue && request.ReminderAtUtc.Value.Kind != DateTimeKind.Utc) errors.Add("ReminderAtUtc must be UTC.");
        ThrowIfAny(errors);
    }

    public static void Validate(UpdateTaskRequest request)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors.Add("Task title is required.");
        if (request.ReminderAtUtc.HasValue && request.ReminderAtUtc.Value.Kind != DateTimeKind.Utc) errors.Add("ReminderAtUtc must be UTC.");
        ThrowIfAny(errors);
    }

    public static void Validate(CreateHabitRequest request)
    {
        var errors = ValidateHabitShape(request.Title, request.ScheduleType, request.RequiredTimesPerWeek, request.ActiveDays);
        ThrowIfAny(errors);
    }

    public static void Validate(UpdateHabitRequest request)
    {
        var errors = ValidateHabitShape(request.Title, request.ScheduleType, request.RequiredTimesPerWeek, request.ActiveDays);
        ThrowIfAny(errors);
    }

    public static void Validate(CreateProjectRequest request)
    {
        ThrowIfAny(string.IsNullOrWhiteSpace(request.Title) ? ["Project title is required."] : []);
    }

    public static void Validate(CreateProjectSectionRequest request)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors.Add("Section title is required.");
        if (request.Visibility == SectionVisibility.AssignedToMember && request.AssignedUserId is null) errors.Add("Assigned sections require an assigned user.");
        ThrowIfAny(errors);
    }

    private static List<string> ValidateHabitShape(string title, HabitScheduleType scheduleType, int? requiredTimesPerWeek, IReadOnlyCollection<DayOfWeek> activeDays)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(title)) errors.Add("Habit title is required.");
        if (scheduleType == HabitScheduleType.SpecificDays && activeDays.Count == 0) errors.Add("Specific day habits require at least one active day.");
        if (scheduleType == HabitScheduleType.TimesPerWeek && (!requiredTimesPerWeek.HasValue || requiredTimesPerWeek <= 0 || requiredTimesPerWeek > 7)) errors.Add("Times-per-week habits require a value from 1 to 7.");
        return errors;
    }

    private static void ThrowIfAny(IReadOnlyCollection<string> errors)
    {
        if (errors.Count > 0) throw new RequestValidationException(errors);
    }
}
