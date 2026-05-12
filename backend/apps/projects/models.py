"""Project and ProjectMember models."""
from django.db import models
from django.conf import settings
from core.models import BaseModel


class Project(BaseModel):

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_projects",
    )
    identifier = models.CharField(
        max_length=10,
        help_text="Short project code, e.g. TF-1",
        blank=True,
    )
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_public = models.BooleanField(default=False)

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ProjectMember",
        through_fields=("project", "user"),
        related_name="projects",
    )

    class Meta:
        db_table = "projects"
        ordering = ["-created_at"]
        verbose_name = "Project"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.identifier:
            # Auto-generate identifier from title (e.g. "Task Flow" → "TF")
            words = self.title.upper().split()
            self.identifier = "".join(w[0] for w in words[:3])
        super().save(*args, **kwargs)

    @property
    def task_count(self):
        return self.tasks.count()

    @property
    def completed_task_count(self):
        return self.tasks.filter(status="done").count()

    @property
    def completion_percentage(self):
        total = self.task_count
        if total == 0:
            return 0
        return round((self.completed_task_count / total) * 100)


class ProjectMember(models.Model):
    """Through-table for Project ↔ User many-to-many with project-level roles."""

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="projectmember_set")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )

    class Meta:
        db_table = "project_members"
        unique_together = [["project", "user"]]
        ordering = ["joined_at"]

    def __str__(self):
        return f"{self.user.full_name} → {self.project.title} ({self.role})"
