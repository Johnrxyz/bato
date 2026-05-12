"""TimeLog URL routing."""
from django.urls import path
from .views import TimeLogListCreateView, TimeLogDetailView

urlpatterns = [
    path("", TimeLogListCreateView.as_view(), name="timelog-list"),
    path("<uuid:pk>/", TimeLogDetailView.as_view(), name="timelog-detail"),
]
