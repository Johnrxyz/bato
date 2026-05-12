"""Custom DRF permission classes."""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: owner can write, others can only read."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user


class IsProjectMember(BasePermission):
    """Allow access only to members of the project attached to the object."""

    def has_object_permission(self, request, view, obj):
        project = getattr(obj, "project", obj)
        return project.members.filter(id=request.user.id).exists()


class IsProjectOwnerOrManager(BasePermission):
    """Allow write access only to project owners or members with manager role."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        project = getattr(obj, "project", obj)
        if project.owner == request.user:
            return True
        return project.projectmember_set.filter(
            user=request.user, role__in=["owner", "manager"]
        ).exists()


class IsSelfOrAdmin(BasePermission):
    """Allow users to access only their own objects, unless they are staff."""

    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.is_staff


class IsAdminUser(BasePermission):
    """Allow access to Django staff/superusers only."""

    def has_permission(self, request, view):
        return request.user and request.user.is_staff
