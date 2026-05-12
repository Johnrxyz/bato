"""Admin for TimeLog."""
from django.contrib import admin
from .models import TimeLog


@admin.register(TimeLog)
class TimeLogAdmin(admin.ModelAdmin):
    list_display = ["task", "user", "duration", "started_at", "is_manual", "created_at"]
    list_filter = ["is_manual"]
    search_fields = ["task__title", "user__email", "note"]
    readonly_fields = ["id", "created_at"]
    raw_id_fields = ["task", "user"]
