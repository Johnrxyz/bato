"""Reusable view mixins."""
from rest_framework.response import Response
from rest_framework import status


class SerializerActionMixin:
    """Use different serializers per action (list vs detail vs create)."""

    serializer_action_classes = {}

    def get_serializer_class(self):
        return self.serializer_action_classes.get(self.action, super().get_serializer_class())


class SoftDeleteMixin:
    """ViewSet mixin that calls soft-delete instead of hard-delete."""

    def perform_destroy(self, instance):
        instance.delete()


class ActivityLogMixin:
    """Mixin that creates an activity log entry after create/update/destroy."""

    activity_model = None

    def _log_activity(self, request, instance, action, extra=None):
        if self.activity_model is None:
            return
        self.activity_model.objects.create(
            actor=request.user,
            action=action,
            content_object=instance,
            extra=extra or {},
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_activity(self.request, instance, "created")
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_activity(self.request, instance, "updated")
        return instance

    def perform_destroy(self, instance):
        self._log_activity(self.request, instance, "deleted")
        instance.delete()
