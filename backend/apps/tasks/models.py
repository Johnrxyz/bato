"""Task, TaskAssignment, Comment, Attachment, and ActivityLog models."""
import os
from django.db import models
from django.conf import settings
from core.models import BaseModel
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from apps.projects.models import Project
    from django.contrib.auth import get_user_model
    User = get_user_model()


class Task(BaseModel):


    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        IN_REVIEW = "in_review", "In Review"
        DONE = "done", "Done"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        NONE = "none", "None"
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    project: Optional['Project'] = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
        db_index=True,
        null=True,
        blank=True,
    )
    creator: Optional['User'] = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
    )
    title = models.CharField(max_length=500, db_index=True)
    description = models.TextField(blank=True)  # Stored as Tiptap JSON string
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TODO, db_index=True
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.NONE, db_index=True
    )
    due_date = models.DateTimeField(null=True, blank=True, db_index=True)
    # Kanban column ordering — lower = higher in column
    position = models.FloatField(default=0.0, db_index=True)
    # Optional parent task for sub-tasks
    parent: Optional['Task'] = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subtasks",
    )
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="TaskAssignment",
        through_fields=("task", "user"),
        related_name="assigned_tasks",
        blank=True,
    )
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    progress = models.PositiveSmallIntegerField(default=0, help_text="Completion percentage (0-100)")

    class Meta:
        db_table = "tasks"
        ordering = ["position", "-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["project", "priority"]),
            models.Index(fields=["project", "due_date"]),
        ]

    def __str__(self):
        project_prefix = f"[{self.project.identifier}] " if self.project else ""
        return f"{project_prefix}{self.title}"

    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.due_date and self.due_date < timezone.now() and self.status != self.Status.DONE

    @property
    def total_logged_seconds(self):
        return self.timelogs.aggregate(
            total=models.Sum("duration")
        )["total"] or 0


class TaskAssignment(models.Model):

    task: 'Task' = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="assignments")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_memberships"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assignments_given",
    )

    class Meta:
        db_table = "task_assignments"
        unique_together = [["task", "user"]]


class Comment(BaseModel):

    task: 'Task' = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author: 'User' = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    body = models.TextField()
    parent: Optional['Comment'] = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
    is_edited = models.BooleanField(default=False)

    class Meta:
        db_table = "comments"
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.display_name} on {self.task.title}"


def attachment_upload_path(instance, filename):
    return f"attachments/{instance.task.project_id}/{instance.task_id}/{filename}"


class Attachment(BaseModel):

    task: 'Task' = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="attachments")
    uploaded_by: Optional['User'] = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="attachments"
    )
    file = models.FileField(upload_to=attachment_upload_path)
    filename = models.CharField(max_length=255)
    size = models.PositiveIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "attachments"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.filename:
            self.filename = os.path.basename(self.file.name)
        super().save(*args, **kwargs)


class ActivityLog(models.Model):
    objects = models.Manager()

    """Immutable audit trail of task changes."""

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        STATUS_CHANGED = "status_changed", "Status Changed"
        PRIORITY_CHANGED = "priority_changed", "Priority Changed"
        ASSIGNED = "assigned", "Assigned"
        UNASSIGNED = "unassigned", "Unassigned"
        COMMENTED = "commented", "Commented"
        ATTACHMENT_ADDED = "attachment_added", "Attachment Added"
        DUE_DATE_CHANGED = "due_date_changed", "Due Date Changed"

    task: 'Task' = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activity_logs")
    actor: Optional['User'] = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="activity_logs"
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    from_value = models.CharField(max_length=500, blank=True)
    to_value = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]
