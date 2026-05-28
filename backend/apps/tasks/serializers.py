"""Serializers for Task, Comment, Attachment, and ActivityLog."""
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from apps.accounts.serializers import UserMinimalSerializer
from .models import Task, TaskAssignment, Comment, Attachment, ActivityLog


class TaskAssignmentSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TaskAssignment
        fields = ["user", "assigned_at"]


class ActivityLogSerializer(serializers.ModelSerializer):
    actor = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "actor", "action", "from_value", "to_value", "created_at"]


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserMinimalSerializer(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ["id", "filename", "size", "mime_type", "url", "uploaded_by", "created_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class AttachmentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["file"]

    def create(self, validated_data):
        file = validated_data["file"]
        return Attachment.objects.create(
            file=file,
            filename=file.name,
            size=file.size,
            mime_type=getattr(file, "content_type", ""),
            **{k: v for k, v in validated_data.items() if k != "file"},
        )


class CommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "body", "author", "parent", "is_edited", "replies", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "is_edited", "created_at", "updated_at"]

    def get_replies(self, obj):

        children = obj.replies.select_related("author").all()
        return CommentSerializer(children, many=True, context=self.context).data


class TaskListSerializer(serializers.ModelSerializer):
    """Compact representation for list/Kanban views."""
    assignees = UserMinimalSerializer(many=True, read_only=True)
    creator = UserMinimalSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    is_working = serializers.SerializerMethodField()
    total_logged_seconds = serializers.IntegerField(read_only=True)
    active_timer_start = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "status", "priority", "due_date", "position",
            "assignees", "creator", "is_overdue", "comment_count",
            "attachment_count", "progress", "is_working", "parent", 
            "total_logged_seconds", "active_timer_start", "project", "created_at",
        ]

    def get_project(self, obj):
        if not obj.project:
            return None
        from apps.projects.serializers import ProjectMinimalSerializer
        return ProjectMinimalSerializer(obj.project).data

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_attachment_count(self, obj):
        return obj.attachments.count()

    def get_is_working(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return False
        return obj.timelogs.filter(user=user, ended_at__isnull=True).exists()

    def get_active_timer_start(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return None
        active = obj.timelogs.filter(user=user, ended_at__isnull=True).first()
        return active.started_at if active else None


class TaskDetailSerializer(serializers.ModelSerializer):
    """Full task representation for detail/edit views."""
    assignees = UserMinimalSerializer(many=True, read_only=True)
    creator = UserMinimalSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    total_logged_seconds = serializers.IntegerField(read_only=True)
    subtask_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority",
            "due_date", "position", "assignees", "creator",
            "project", "parent", "estimated_hours", "progress",
            "is_overdue", "total_logged_seconds", "subtask_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "creator", "project", "created_at", "updated_at"]

    def get_subtask_count(self, obj):
        return obj.subtasks.count()


class TaskCreateSerializer(serializers.ModelSerializer):
    assignee_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = Task
        fields = [
            "title", "description", "status", "priority",
            "due_date", "project", "parent", "estimated_hours",
            "position", "assignee_ids", "progress",
        ]

    def validate_project(self, project):
        if project is None:
            return None
        user = self.context["request"].user
        if not project.members.filter(id=user.id).exists() and not user.is_staff:
            raise serializers.ValidationError("You are not a member of this project.")
        return project

    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        assignee_ids = validated_data.pop("assignee_ids", [])
        user = self.context["request"].user
        
        task = Task.objects.create(
            creator=user,
            **validated_data,
        )
        
        # If no assignees are provided, auto-assign to the creator
        if not assignee_ids:
            TaskAssignment.objects.create(
                task=task,
                user=user,
                assigned_by=user,
            )
        else:
            User = get_user_model()
            users = User.objects.filter(id__in=assignee_ids)
            for assignee in users:
                TaskAssignment.objects.create(
                    task=task,
                    user=assignee,
                    assigned_by=user,
                )
        return task


class TaskUpdateSerializer(serializers.ModelSerializer):
    assignee_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Task
        fields = [
            "title", "description", "status", "priority",
            "due_date", "parent", "estimated_hours", "position", "assignee_ids", "progress",
        ]

    def update(self, instance, validated_data):
        from django.contrib.auth import get_user_model
        assignee_ids = validated_data.pop("assignee_ids", None)
        instance = super().update(instance, validated_data)

        if assignee_ids is not None:
            User = get_user_model()
            instance.assignments.all().delete()
            for uid in assignee_ids:
                try:
                    user = User.objects.get(id=uid)
                    TaskAssignment.objects.create(
                        task=instance,
                        user=user,
                        assigned_by=self.context["request"].user,
                    )
                except User.DoesNotExist:
                    pass

        return instance


class KanbanReorderSerializer(serializers.Serializer):
    """Accepts new status + position for a Kanban card drag."""
    status = serializers.ChoiceField(choices=Task.Status.choices)
    position = serializers.FloatField()
