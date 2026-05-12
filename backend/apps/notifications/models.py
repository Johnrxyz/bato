"""Notification model."""
import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):

    class Type(models.TextChoices):
        COMMENT = "comment", "Comment"
        ASSIGNMENT = "assignment", "Assignment"
        STATUS_CHANGE = "status_change", "Status Change"
        DUE_SOON = "due_soon", "Due Soon"
        MENTION = "mention", "Mention"
        PROJECT_INVITE = "project_invite", "Project Invite"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    action_url = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]

    def __str__(self):
        return f"[{self.type}] → {self.recipient.display_name}: {self.title}"
