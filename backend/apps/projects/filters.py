"""django-filter FilterSets for Projects."""
import django_filters
from .models import Project


class ProjectFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Project.Status.choices)
    owner = django_filters.UUIDFilter(field_name="owner__id")
    due_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")

    class Meta:
        model = Project
        fields = ["status", "owner", "due_before", "due_after"]
