"""Admin registration for Project models."""
from django.contrib import admin
from .models import Project, ProjectMember


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 0
    raw_id_fields = ["user", "invited_by"]
    readonly_fields = ["joined_at"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "identifier", "status", "owner", "due_date", "task_count", "created_at"]
    list_filter = ["status"]
    search_fields = ["title", "identifier", "description"]
    raw_id_fields = ["owner"]
    readonly_fields = ["id", "identifier", "created_at", "updated_at"]
    inlines = [ProjectMemberInline]
