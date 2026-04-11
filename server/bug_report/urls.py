from django.urls import path
from .views import BugReportListCreateView, BugReportRetrieveUpdateDestroyView

urlpatterns = [
    path('bug-reports/', BugReportListCreateView.as_view(), name='bugreport-list-create'),
    path('bug-reports/<int:pk>/', BugReportRetrieveUpdateDestroyView.as_view(), name='bugreport-detail'),
]
