"""WebSocket URL routing for the tasks app (Django Channels — Docker only)."""
from django.urls import re_path
from . import consumers

task_urlpatterns = [
    re_path(r"ws/project/(?P<project_id>[^/]+)/$", consumers.ProjectConsumer.as_asgi()),
]
