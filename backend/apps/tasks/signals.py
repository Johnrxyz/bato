"""Signals for the tasks app — activity logging and notifications."""
from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from .models import Task, Comment, ActivityLog, Attachment, TaskAssignment


@receiver(post_save, sender=Task)
def log_task_creation(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance,
            actor=instance.creator,
            action=ActivityLog.Action.CREATED,
        )


@receiver(pre_save, sender=Task)
def log_task_updates(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_instance = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return

    # Check for status changes
    if old_instance.status != instance.status:
        ActivityLog.objects.create(
            task=instance,
            actor=getattr(instance, '_actor', instance.creator),
            action=ActivityLog.Action.STATUS_CHANGED,
            from_value=old_instance.status,
            to_value=instance.status,
        )

    # Check for priority changes
    if old_instance.priority != instance.priority:
        ActivityLog.objects.create(
            task=instance,
            actor=getattr(instance, '_actor', instance.creator),
            action=ActivityLog.Action.PRIORITY_CHANGED,
            from_value=old_instance.priority,
            to_value=instance.priority,
        )

    # Check for due date changes
    if old_instance.due_date != instance.due_date:
        ActivityLog.objects.create(
            task=instance,
            actor=getattr(instance, '_actor', instance.creator),
            action=ActivityLog.Action.DUE_DATE_CHANGED,
            from_value=str(old_instance.due_date) if old_instance.due_date else "",
            to_value=str(instance.due_date) if instance.due_date else "",
        )


@receiver(m2m_changed, sender=TaskAssignment)
def log_assignment_changes(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(pk__in=pk_set)
        for user in users:
            ActivityLog.objects.create(
                task=instance,
                actor=getattr(instance, '_actor', None),
                action=ActivityLog.Action.ASSIGNED,
                to_value=user.display_name,
            )
    elif action == "post_remove":
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(pk__in=pk_set)
        for user in users:
            ActivityLog.objects.create(
                task=instance,
                actor=getattr(instance, '_actor', None),
                action=ActivityLog.Action.UNASSIGNED,
                to_value=user.display_name,
            )


@receiver(post_save, sender=Comment)
def log_comment_activity(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance.task,
            actor=instance.author,
            action=ActivityLog.Action.COMMENTED,
            to_value=instance.body[:200],
        )
        # Create notification for task assignees
        _notify_task_members(instance.task, instance.author, "comment", instance)


@receiver(post_save, sender=Attachment)
def log_attachment_activity(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance.task,
            actor=instance.uploaded_by,
            action=ActivityLog.Action.ATTACHMENT_ADDED,
            to_value=instance.filename,
        )


def _notify_task_members(task, actor, event_type, obj):
    """Dispatch in-app notifications to task assignees (excluding the actor)."""
    from apps.notifications.models import Notification
    recipients = task.assignees.exclude(id=actor.id)
    notifications = [
        Notification(
            recipient=user,
            type=Notification.Type.COMMENT,
            title=f'New comment on "{task.title}"',
            body=f"{actor.display_name} commented on a task you're assigned to.",
            action_url=f"/tasks/{task.id}",
        )
        for user in recipients
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)
