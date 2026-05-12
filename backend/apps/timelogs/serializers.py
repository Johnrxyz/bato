"""TimeLog serializer and views."""
from rest_framework import serializers
from apps.accounts.serializers import UserMinimalSerializer
from .models import TimeLog


class TimeLogSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    duration_display = serializers.SerializerMethodField()

    class Meta:
        model = TimeLog
        fields = [
            "id", "task", "user", "duration", "duration_display",
            "started_at", "ended_at", "is_manual", "note", "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def get_duration_display(self, obj):
        h = obj.duration // 3600
        m = (obj.duration % 3600) // 60
        s = obj.duration % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    def validate(self, attrs):
        if attrs.get("ended_at") and attrs.get("started_at"):
            if attrs["ended_at"] <= attrs["started_at"]:
                raise serializers.ValidationError({"ended_at": "end time must be after start time."})
            if not attrs.get("duration"):
                delta = attrs["ended_at"] - attrs["started_at"]
                attrs["duration"] = int(delta.total_seconds())
        return attrs

    def create(self, validated_data):
        return TimeLog.objects.create(user=self.context["request"].user, **validated_data)
