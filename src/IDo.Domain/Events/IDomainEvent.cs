namespace IDo.Domain.Events;

public interface IDomainEvent
{
    DateTime OccurredAtUtc { get; }
}
