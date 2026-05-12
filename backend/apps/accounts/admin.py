"""Admin registration for the User model."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "full_name", "system_role", "is_active", "is_staff", "created_at"]
    list_filter = ["system_role", "is_active", "is_staff"]
    search_fields = ["email", "full_name"]
    ordering = ["full_name"]
    readonly_fields = ["id", "created_at", "updated_at", "last_login"]

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Personal", {"fields": ("full_name", "avatar", "job_title", "timezone")}),
        ("Permissions", {"fields": ("system_role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("created_at", "updated_at", "last_login")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password1", "password2", "system_role"),
        }),
    )
