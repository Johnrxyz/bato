"""Timelogs app configuration."""
from django.apps import AppConfig


class TimelogsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.timelogs"
    label = "timelogs"
