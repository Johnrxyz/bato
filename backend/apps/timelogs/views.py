"""TimeLog views."""
from rest_framework import generics, permissions
from drf_spectacular.utils import extend_schema

from .models import TimeLog
from .serializers import TimeLogSerializer


class TimeLogListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/timelogs/ — list or create time logs."""
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TimeLog.objects.filter(user=self.request.user).select_related("task", "user")
        task_id = self.request.query_params.get("task")
        if task_id:
            qs = qs.filter(task__id=task_id)
        return qs

    @extend_schema(tags=["Time Tracking"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=["Time Tracking"])
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class TimeLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/timelogs/{id}/"""
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return TimeLog.objects.filter(user=self.request.user)

    @extend_schema(tags=["Time Tracking"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=["Time Tracking"])
    def patch(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(tags=["Time Tracking"])
    def delete(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
