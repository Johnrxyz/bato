"""django-filter FilterSets for Tasks."""
import django_filters
from .models import Task


class TaskFilter(django_filters.FilterSet):
    project = django_filters.UUIDFilter(field_name="project__id")
    status = django_filters.MultipleChoiceFilter(choices=Task.Status.choices)
    priority = django_filters.MultipleChoiceFilter(choices=Task.Priority.choices)
    assignee = django_filters.CharFilter(method="filter_assignee")
    creator = django_filters.CharFilter(method="filter_creator")
    due_before = django_filters.DateTimeFilter(field_name="due_date", lookup_expr="lte")
    due_after = django_filters.DateTimeFilter(field_name="due_date", lookup_expr="gte")
    is_overdue = django_filters.BooleanFilter(method="filter_overdue")
    no_parent = django_filters.BooleanFilter(field_name="parent", lookup_expr="isnull")

    class Meta:
        model = Task
        fields = ["project", "status", "priority", "assignee", "creator"]

    def filter_assignee(self, queryset, name, value):
        if value == "me":
            return queryset.filter(assignees__id=self.request.user.id)
        return queryset.filter(assignees__id=value)

    def filter_creator(self, queryset, name, value):
        if value == "me":
            return queryset.filter(creator__id=self.request.user.id)
        return queryset.filter(creator__id=value)

    def filter_overdue(self, queryset, name, value):
        from django.utils import timezone
        now = timezone.now()
        if value:
            return queryset.filter(due_date__lt=now).exclude(status=Task.Status.DONE)
        return queryset.exclude(due_date__lt=now).exclude(status=Task.Status.DONE)
