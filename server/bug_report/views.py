from rest_framework import generics
from .models import BugReport
from .serializers import BugReportSerializer

from rest_framework.permissions import AllowAny


class BugReportListCreateView(generics.ListCreateAPIView):
	queryset = BugReport.objects.all().order_by('-created_at')
	serializer_class = BugReportSerializer
	permission_classes = [AllowAny]


class BugReportRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = BugReport.objects.all()
	serializer_class = BugReportSerializer
	permission_classes = [AllowAny]
