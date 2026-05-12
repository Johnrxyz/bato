"""Admin registration for Task models."""
from django.contrib import admin
from .models import Task, TaskAssignment, Comment, Attachment, ActivityLog


class TaskAssignmentInline(admin.TabularInline):
    model = TaskAssignment
    extra = 0
    raw_id_fields = ["user", "assigned_by"]
    readonly_fields = ["assigned_at"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "status", "priority", "due_date", "creator", "created_at"]
    list_filter = ["status", "priority", "project"]
    search_fields = ["title", "description"]
    raw_id_fields = ["project", "creator", "parent"]
    readonly_fields = ["id", "created_at", "updated_at", "deleted_at"]
    inlines = [TaskAssignmentInline]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["task", "author", "is_edited", "created_at"]
    raw_id_fields = ["task", "author", "parent"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["task", "actor", "action", "from_value", "to_value", "created_at"]
    list_filter = ["action"]
    readonly_fields = ["task", "actor", "action", "from_value", "to_value", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
