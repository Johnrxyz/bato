"""URL routing for the reports app."""
from django.urls import path
from .views import (
    DashboardReportView,
    ProductivityReportView,
    WorkloadReportView,
    OverdueReportView,
    ProjectVelocityView,
)

urlpatterns = [
    path("dashboard/", DashboardReportView.as_view(), name="report-dashboard"),
    path("productivity/", ProductivityReportView.as_view(), name="report-productivity"),
    path("workload/", WorkloadReportView.as_view(), name="report-workload"),
    path("overdue/", OverdueReportView.as_view(), name="report-overdue"),
    path("project/<uuid:project_id>/velocity/", ProjectVelocityView.as_view(), name="report-velocity"),
]
