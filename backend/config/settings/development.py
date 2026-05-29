"""Development settings — DEBUG on, SQLite fallback, verbose logging."""
from .base import *  # noqa: F401, F403

DEBUG = True

# Allow all hosts locally
ALLOWED_HOSTS = ["*"]

# Required for Django 4.0+ when accessed over HTTPS (e.g. PythonAnywhere)
CSRF_TRUSTED_ORIGINS = [
    "https://ryee.pythonanywhere.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Django Debug Toolbar (optional, install separately)
INTERNAL_IPS = ["127.0.0.1"]

# Relax CORS for local development
CORS_ALLOW_ALL_ORIGINS = True

# Verbose logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {module} — {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
    "loggers": {
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",  # Set to DEBUG to see all SQL queries
            "propagate": False,
        },
    },
}

# Use in-memory channel layer for development (no Redis needed)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}
