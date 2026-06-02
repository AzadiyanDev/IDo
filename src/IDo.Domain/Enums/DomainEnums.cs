namespace IDo.Domain.Enums;

public enum IDoTaskStatus { Todo, InProgress, Review, Done, Overdue, Archived }
public enum IDoTaskType { Personal, Project, Habit }
public enum HabitScheduleType { SpecificDays, TimesPerWeek }
public enum HabitDayType { Active, Rest }
public enum HabitLogStatus { Done, Missed, Skipped, RestDay, OutOfSchedule }
public enum ProjectStatus { Active, Completed, Archived }
public enum ProjectMemberRole { Owner, Member }
public enum ProjectMemberStatus { Active, Pending, Rejected, Removed }
public enum SectionVisibility { Public, AssignedToMember }
public enum ProjectSectionAssignmentStatus { None, Pending, Accepted, Rejected }
public enum ProjectTaskAssignmentStatus { None, Pending, Accepted, Rejected }
public enum CollaborationRequestType { ProjectInvite, SectionAssignment, TaskAssignment }
public enum TaskRequestStatus { Pending, Accepted, Rejected, Cancelled }
public enum NotificationType { HabitReminder, TaskReminder, TaskRequest, ProjectInvite, DeadlineAlert }
