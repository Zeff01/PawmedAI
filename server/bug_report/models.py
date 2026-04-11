from django.db import models

class BugReport(models.Model):
	SEVERITY_CHOICES = [
		('low', 'Low'),
		('medium', 'Medium'),
		('high', 'High'),
	]

	title = models.CharField(max_length=255)
	description = models.TextField()
	severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.title
