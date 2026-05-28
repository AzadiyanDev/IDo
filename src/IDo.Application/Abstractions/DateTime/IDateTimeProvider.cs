namespace IDo.Application.Abstractions.DateTime;

public interface IDateTimeProvider
{
    System.DateTime UtcNow { get; }
    DateOnly Today { get; }
}
