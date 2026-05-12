"""Serializers for Project and ProjectMember."""
from rest_framework import serializers
from apps.accounts.serializers import UserMinimalSerializer
from .models import Project, ProjectMember


class ProjectMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "title"]


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ["id", "user", "user_id", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class ProjectListSerializer(serializers.ModelSerializer):
    """Compact representation for list views."""
    owner = UserMinimalSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "identifier", "description", "status",
            "owner", "member_count", "task_count", "completion_percentage",
            "start_date", "due_date", "created_at",
        ]

    def get_member_count(self, obj):
        return obj.projectmember_set.count()


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Full representation including members for detail views."""
    owner = UserMinimalSerializer(read_only=True)
    members = ProjectMemberSerializer(source="projectmember_set", many=True, read_only=True)
    tasks = serializers.SerializerMethodField()
    task_count = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "identifier", "description", "status",
            "owner", "members", "tasks", "task_count", "completed_task_count",
            "completion_percentage", "start_date", "due_date",
            "is_public", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "identifier", "owner", "created_at", "updated_at"]

    def get_tasks(self, obj):
        from apps.tasks.serializers import TaskListSerializer
        # Prefetching should be handled in the viewset for efficiency
        tasks = obj.tasks.all()
        return TaskListSerializer(tasks, many=True, context=self.context).data


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["title", "description", "status", "start_date", "due_date", "is_public"]

    def create(self, validated_data):
        user = self.context["request"].user
        project = Project.objects.create(owner=user, **validated_data)
        # Auto-add creator as owner member
        ProjectMember.objects.create(
            project=project,
            user=user,
            role=ProjectMember.Role.OWNER,
        )
        return project


class ProjectUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["title", "description", "status", "start_date", "due_date", "is_public"]
