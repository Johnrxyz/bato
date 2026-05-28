"""Analytics and reporting views."""
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from drf_spectacular.utils import extend_schema

from apps.tasks.models import Task
from apps.projects.models import Project
from apps.timelogs.models import TimeLog
from apps.notifications.models import Notification


class DashboardReportView(APIView):
    """GET /api/reports/dashboard/ — summary metrics for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reports"])
    def get(self, request):
        user = request.user
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        # Task counts scoped to user's projects
        base_qs = Task.objects.filter(project__members=user)

        task_counts = base_qs.aggregate(
            total=Count("id"),
            todo=Count("id", filter=Q(status="todo")),
            in_progress=Count("id", filter=Q(status="in_progress")),
            in_review=Count("id", filter=Q(status="in_review")),
            done=Count("id", filter=Q(status="done")),
            overdue=Count(
                "id",
                filter=Q(due_date__lt=now) & ~Q(status__in=["done", "cancelled"]),
            ),
        )

        assigned_counts = base_qs.filter(assignees=user).aggregate(
            total=Count("id"),
            overdue=Count(
                "id",
                filter=Q(due_date__lt=now) & ~Q(status__in=["done", "cancelled"]),
            ),
        )

        # Recent activity (last 7 days)
        completed_this_week = base_qs.filter(
            status="done", updated_at__gte=week_ago
        ).count()

        created_this_week = base_qs.filter(created_at__gte=week_ago).count()

        # Time logged this week
        time_this_week = TimeLog.objects.filter(
            user=user, started_at__gte=week_ago
        ).aggregate(total=Sum("duration"))["total"] or 0

        # Project health
        projects = Project.objects.filter(members=user).annotate(
            total=Count("tasks"),
            done=Count("tasks", filter=Q(tasks__status="done")),
            overdue=Count(
                "tasks",
                filter=Q(tasks__due_date__lt=now) & ~Q(tasks__status__in=["done", "cancelled"]),
            ),
        ).values("id", "title", "status", "total", "done", "overdue", "due_date")

        project_list = []
        for p in projects:
            pct = round((p["done"] / p["total"]) * 100) if p["total"] else 0
            project_list.append({**p, "completion_percentage": pct, "id": str(p["id"])})

        # Status distribution for chart
        status_distribution = [
            {"status": k, "label": v, "count": task_counts.get(k, 0)}
            for k, v in Task.Status.choices
        ]

        return Response({
            "task_counts": task_counts,
            "assigned": assigned_counts,
            "completed_this_week": completed_this_week,
            "created_this_week": created_this_week,
            "time_logged_this_week_seconds": time_this_week,
            "status_distribution": status_distribution,
            "projects": project_list,
            "unread_notifications": Notification.objects.filter(
                recipient=user, is_read=False
            ).count(),
        })


class ProductivityReportView(APIView):
    """GET /api/reports/productivity/ — daily completion trend for the past N days."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reports"])
    def get(self, request):
        user = request.user
        days = int(request.query_params.get("days", 30))
        now = timezone.now()
        start = now - timedelta(days=days)

        tasks_completed = (
            Task.objects.filter(
                project__members=user,
                status="done",
                updated_at__gte=start,
            )
            .extra(select={"day": "DATE(tasks.updated_at)"})
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        time_per_day = (
            TimeLog.objects.filter(user=user, started_at__gte=start)
            .extra(select={"day": "DATE(started_at)"})
            .values("day")
            .annotate(total_seconds=Sum("duration"))
            .order_by("day")
        )

        return Response({
            "period_days": days,
            "tasks_completed_by_day": list(tasks_completed),
            "time_logged_by_day": list(time_per_day),
        })


class WorkloadReportView(APIView):
    """GET /api/reports/workload/ — per-member task load for a project."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reports"])
    def get(self, request):
        project_id = request.query_params.get("project")

        qs = Task.objects.filter(project__members=request.user)
        if project_id:
            qs = qs.filter(project__id=project_id)

        workload = (
            qs.filter(assignees__isnull=False)
            .values(
                "assignees__id",
                "assignees__full_name",
                "assignees__email",
            )
            .annotate(
                total=Count("id"),
                done=Count("id", filter=Q(status="done")),
                in_progress=Count("id", filter=Q(status="in_progress")),
                overdue=Count(
                    "id",
                    filter=Q(due_date__lt=timezone.now()) & ~Q(status__in=["done", "cancelled"]),
                ),
            )
        )

        return Response(list(workload))


class OverdueReportView(APIView):
    """GET /api/reports/overdue/ — all overdue tasks visible to the user."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reports"])
    def get(self, request):
        now = timezone.now()
        tasks = (
            Task.objects.filter(
                project__members=request.user,
                due_date__lt=now,
            )
            .exclude(status__in=["done", "cancelled"])
            .select_related("project", "creator")
            .prefetch_related("assignees")
            .order_by("due_date")
        )

        from apps.tasks.serializers import TaskListSerializer
        serializer = TaskListSerializer(tasks, many=True, context={"request": request})
        return Response(serializer.data)


class ProjectVelocityView(APIView):
    """GET /api/reports/project/{id}/velocity/ — task completion velocity."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reports"])
    def get(self, request, project_id):
        days = int(request.query_params.get("days", 30))
        start = timezone.now() - timedelta(days=days)

        try:
            project = Project.objects.get(id=project_id, members=request.user)
        except Project.DoesNotExist:
            from rest_framework import status as http_status
            return Response({"detail": "Not found."}, status=http_status.HTTP_404_NOT_FOUND)

        completed_by_day = (
            Task.objects.filter(project=project, status="done", updated_at__gte=start)
            .extra(select={"day": "DATE(updated_at)"})
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        created_by_day = (
            Task.objects.filter(project=project, created_at__gte=start)
            .extra(select={"day": "DATE(created_at)"})
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        return Response({
            "project_id": str(project.id),
            "project_title": project.title,
            "period_days": days,
            "completed_by_day": list(completed_by_day),
            "created_by_day": list(created_by_day),
        })
