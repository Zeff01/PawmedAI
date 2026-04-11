from rest_framework import serializers
from .models import BugReport

class BugReportSerializer(serializers.ModelSerializer):
    SEVERITY_CHOICES = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]

    severity = serializers.ChoiceField(choices=SEVERITY_CHOICES)

    class Meta:
        model = BugReport
        fields = ['id', 'title', 'description', 'severity', 'created_at', 'updated_at']
