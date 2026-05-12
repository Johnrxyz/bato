"""
ASGI config — required for Django Channels (WebSocket) in Docker/production.
PythonAnywhere uses WSGI (wsgi.py) — Channels consumers are inactive there.
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

django_asgi_app = get_asgi_application()

from apps.notifications.routing import notification_urlpatterns  # noqa: E402
from apps.tasks.routing import task_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(notification_urlpatterns + task_urlpatterns)
        ),
    }
)
