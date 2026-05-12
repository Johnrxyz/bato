"""ViewSets for Project CRUD and member management."""
from django.contrib.auth import get_user_model
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import SerializerActionMixin, SoftDeleteMixin
from core.permissions import IsProjectOwnerOrManager
from .models import Project, ProjectMember
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectMemberSerializer,
)
from .filters import ProjectFilter

User = get_user_model()


@extend_schema_view(
    list=extend_schema(tags=["Projects"]),
    create=extend_schema(tags=["Projects"]),
    retrieve=extend_schema(tags=["Projects"]),
    update=extend_schema(tags=["Projects"]),
    partial_update=extend_schema(tags=["Projects"]),
    destroy=extend_schema(tags=["Projects"]),
)
class ProjectViewSet(SerializerActionMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    """
    Full CRUD for projects.
    List is scoped to projects the authenticated user is a member of.
    """
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = ProjectFilter
    search_fields = ["title", "description", "identifier"]
    ordering_fields = ["created_at", "due_date", "title"]
    ordering = ["-created_at"]

    serializer_class = ProjectListSerializer
    serializer_action_classes = {
        "list": ProjectListSerializer,
        "retrieve": ProjectDetailSerializer,
        "create": ProjectCreateSerializer,
        "update": ProjectUpdateSerializer,
        "partial_update": ProjectUpdateSerializer,
    }

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.select_related("owner").prefetch_related("projectmember_set__user")
        
        if not user.is_staff:
            qs = qs.filter(members=user)
            
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "tasks__assignees",
                "tasks__creator",
                "tasks__assignments__user",
                "tasks__timelogs",
            )
        return qs

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsProjectOwnerOrManager()]
        return [permissions.IsAuthenticated()]

    @extend_schema(tags=["Projects"])
    @action(detail=True, methods=["get"], url_path="members")
    def members(self, request, pk=None):
        """GET /api/projects/{id}/members/ — list project members."""
        project = self.get_object()
        memberships = project.projectmember_set.select_related("user", "invited_by")
        serializer = ProjectMemberSerializer(memberships, many=True)
        return Response(serializer.data)

    @extend_schema(tags=["Projects"])
    @action(detail=True, methods=["post"], url_path="members/add")
    def add_member(self, request, pk=None):
        """POST /api/projects/{id}/members/add/ — add a user to the project."""
        project = self.get_object()
        serializer = ProjectMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data["user_id"]
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if ProjectMember.objects.filter(project=project, user=user).exists():
            return Response({"detail": "User is already a member."}, status=status.HTTP_400_BAD_REQUEST)

        membership = ProjectMember.objects.create(
            project=project,
            user=user,
            role=serializer.validated_data.get("role", ProjectMember.Role.MEMBER),
            invited_by=request.user,
        )
        return Response(ProjectMemberSerializer(membership).data, status=status.HTTP_201_CREATED)

    @extend_schema(tags=["Projects"])
    @action(detail=True, methods=["delete"], url_path="members/(?P<user_id>[^/.]+)")
    def remove_member(self, request, pk=None, user_id=None):
        """DELETE /api/projects/{id}/members/{user_id}/ — remove a member."""
        project = self.get_object()
        try:
            membership = ProjectMember.objects.get(project=project, user__id=user_id)
        except ProjectMember.DoesNotExist:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)

        if membership.role == ProjectMember.Role.OWNER:
            return Response({"detail": "Cannot remove the project owner."}, status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(tags=["Projects"])
    @action(detail=True, methods=["patch"], url_path="members/(?P<user_id>[^/.]+)/role")
    def update_member_role(self, request, pk=None, user_id=None):
        """PATCH /api/projects/{id}/members/{user_id}/role — change a member's project role."""
        project = self.get_object()
        try:
            membership = ProjectMember.objects.get(project=project, user__id=user_id)
        except ProjectMember.DoesNotExist:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get("role")
        if role not in ProjectMember.Role.values:
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

        membership.role = role
        membership.save(update_fields=["role"])
        return Response(ProjectMemberSerializer(membership).data)
