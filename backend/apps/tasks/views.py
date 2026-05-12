"""ViewSets for Task CRUD, comments, attachments, activity logs, and Kanban reorder."""
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import SerializerActionMixin, SoftDeleteMixin
from .models import Task, Comment, Attachment, ActivityLog
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    CommentSerializer,
    AttachmentSerializer,
    AttachmentUploadSerializer,
    ActivityLogSerializer,
    KanbanReorderSerializer,
)
from .filters import TaskFilter


@extend_schema_view(
    list=extend_schema(tags=["Tasks"]),
    create=extend_schema(tags=["Tasks"]),
    retrieve=extend_schema(tags=["Tasks"]),
    partial_update=extend_schema(tags=["Tasks"]),
    destroy=extend_schema(tags=["Tasks"]),
)
class TaskViewSet(SerializerActionMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    """
    Full CRUD for tasks.
    Scoped to projects the authenticated user is a member of.
    Includes nested actions for comments, attachments, activity, and Kanban reorder.
    """
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "due_date", "priority", "status", "position"]
    ordering = ["position", "-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    serializer_class = TaskListSerializer
    serializer_action_classes = {
        "list": TaskListSerializer,
        "retrieve": TaskDetailSerializer,
        "create": TaskCreateSerializer,
        "update": TaskUpdateSerializer,
        "partial_update": TaskUpdateSerializer,
    }

    def perform_create(self, serializer):
        instance = serializer.save()
        instance._actor = self.request.user

    def perform_update(self, serializer):
        instance = serializer.instance
        instance._actor = self.request.user
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        qs = (
            Task.objects
            .filter(Q(project__members=user) | Q(project__isnull=True, creator=user))
            .select_related("creator", "project", "parent")
            .prefetch_related("assignees", "assignments__user")
        )
        if user.is_staff:
            qs = Task.objects.select_related("creator", "project", "parent").prefetch_related(
                "assignees", "assignments__user"
            )
        return qs

    # ── Comments ──────────────────────────────────────────────────────────────

    @extend_schema(tags=["Tasks"])
    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        task = self.get_object()

        if request.method == "GET":
            qs = task.comments.filter(parent__isnull=True).select_related("author").prefetch_related("replies__author")
            serializer = CommentSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data)

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(tags=["Tasks"])
    @action(detail=True, methods=["patch", "delete"], url_path="comments/(?P<comment_id>[^/.]+)")
    def comment_detail(self, request, pk=None, comment_id=None):
        task = self.get_object()
        try:
            comment = task.comments.get(id=comment_id, author=request.user)
        except Comment.DoesNotExist:
            return Response({"detail": "Comment not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            comment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = CommentSerializer(comment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        comment.is_edited = True
        serializer.save()
        return Response(serializer.data)

    # ── Attachments ───────────────────────────────────────────────────────────

    @extend_schema(tags=["Tasks"])
    @action(
        detail=True, methods=["get", "post"], url_path="attachments",
        parser_classes=[MultiPartParser, FormParser],
    )
    def attachments(self, request, pk=None):
        task = self.get_object()

        if request.method == "GET":
            qs = task.attachments.select_related("uploaded_by")
            serializer = AttachmentSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data)

        serializer = AttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attachment = serializer.save(task=task, uploaded_by=request.user)
        return Response(
            AttachmentSerializer(attachment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(tags=["Tasks"])
    @action(detail=True, methods=["delete"], url_path="attachments/(?P<attachment_id>[^/.]+)")
    def delete_attachment(self, request, pk=None, attachment_id=None):
        task = self.get_object()
        try:
            attachment = task.attachments.get(id=attachment_id, uploaded_by=request.user)
        except Attachment.DoesNotExist:
            return Response({"detail": "Not found or permission denied."}, status=status.HTTP_404_NOT_FOUND)
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Activity Log ──────────────────────────────────────────────────────────

    @extend_schema(tags=["Tasks"])
    @action(detail=True, methods=["get"], url_path="activity")
    def activity(self, request, pk=None):
        task = self.get_object()
        logs = task.activity_logs.select_related("actor")
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)

    # ── Timer ─────────────────────────────────────────────────────────────────
    @extend_schema(tags=["Tasks"])
    @action(detail=True, methods=["post"], url_path="toggle-timer")
    def toggle_timer(self, request, pk=None):
        """POST /api/tasks/{id}/toggle-timer/ — Start/stop a timer for the current user."""
        task = self.get_object()
        user = request.user
        from django.utils import timezone
        from apps.timelogs.models import TimeLog

        # Check for any active timer for this user
        active_timer = TimeLog.objects.filter(user=user, ended_at__isnull=True).first()

        if active_timer:
            # Stop the current timer
            now = timezone.now()
            duration = int((now - active_timer.started_at).total_seconds())
            active_timer.ended_at = now
            active_timer.duration = duration
            active_timer.save()

            # If it was the same task, we just stopped it.
            if active_timer.task_id == task.id:
                return Response({
                    "status": "stopped",
                    "task_id": task.id,
                    "duration": duration
                })

        # Start a new timer for this task
        TimeLog.objects.create(
            task=task,
            user=user,
            started_at=timezone.now(),
            duration=0,
            is_manual=False
        )
        return Response({"status": "started", "task_id": task.id})

    # ── Kanban Reorder ────────────────────────────────────────────────────────

    @extend_schema(tags=["Tasks"])
    @action(detail=True, methods=["patch"], url_path="reorder")
    def reorder(self, request, pk=None):
        """PATCH /api/tasks/{id}/reorder/ — update status + position for Kanban drag."""
        task = self.get_object()
        serializer = KanbanReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = task.status
        task.status = serializer.validated_data["status"]
        task.position = serializer.validated_data["position"]
        task.save(update_fields=["status", "position", "updated_at"])

        if old_status != task.status:
            ActivityLog.objects.create(
                task=task,
                actor=request.user,
                action=ActivityLog.Action.STATUS_CHANGED,
                from_value=old_status,
                to_value=task.status,
            )

        return Response(TaskListSerializer(task, context={"request": request}).data)
