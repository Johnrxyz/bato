"""TimeLog model for manual and timer-based time tracking."""
import uuid
from django.db import models
from django.conf import settings


class TimeLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        "tasks.Task", on_delete=models.CASCADE, related_name="timelogs"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="timelogs"
    )
    duration = models.PositiveIntegerField(help_text="Duration in seconds")
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    is_manual = models.BooleanField(default=True)
    note = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "timelogs"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["task", "user"]),
            models.Index(fields=["user", "started_at"]),
        ]

    def __str__(self):
        hours = self.duration // 3600
        minutes = (self.duration % 3600) // 60
        return f"{self.user.display_name} — {hours}h {minutes}m on {self.task.title}"
