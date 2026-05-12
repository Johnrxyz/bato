"""Quick smoke test: URL resolution + import check for all apps."""
import os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from django.urls import resolve, reverse

TEST_URLS = [
    "/api/auth/login/",
    "/api/auth/register/",
    "/api/auth/refresh/",
    "/api/auth/logout/",
    "/api/auth/me/",
    "/api/projects/",
    "/api/tasks/",
    "/api/notifications/",
    "/api/timelogs/",
    "/api/reports/dashboard/",
    "/api/reports/productivity/",
    "/api/reports/workload/",
    "/api/reports/overdue/",
]

print("\n=== URL Resolution ===")
errors = []
for url in TEST_URLS:
    try:
        match = resolve(url)
        view = getattr(match.func, "__name__", None) or getattr(match.func, "cls", None)
        print(f"  OK  {url}")
    except Exception as e:
        print(f"  ERR {url} --> {e}")
        errors.append((url, str(e)))

print("\n=== Import Check ===")
modules_to_check = [
    "apps.accounts.views",
    "apps.accounts.serializers",
    "apps.projects.views",
    "apps.projects.serializers",
    "apps.tasks.views",
    "apps.tasks.serializers",
    "apps.tasks.signals",
    "apps.notifications.views",
    "apps.notifications.serializers",
    "apps.timelogs.views",
    "apps.timelogs.serializers",
    "apps.reports.views",
]

for mod in modules_to_check:
    try:
        __import__(mod)
        print(f"  OK  {mod}")
    except Exception as e:
        import traceback
        print(f"  ERR {mod}")
        traceback.print_exc()
        errors.append((mod, str(e)))

print(f"\n{'='*40}")
print(f"Total errors: {len(errors)}")
for item, err in errors:
    print(f"  - {item}: {err}")
