from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import BugReport


class BugReportAPITestCase(APITestCase):
	def setUp(self):
		self.bug1 = BugReport.objects.create(title="Bug 1", description="Desc 1", severity="low")
		self.bug2 = BugReport.objects.create(title="Bug 2", description="Desc 2", severity="high")
		self.list_url = reverse('bugreport-list-create')

	def test_list_bug_reports(self):
		response = self.client.get(self.list_url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 2)

	def test_create_bug_report(self):
		data = {"title": "Bug 3", "description": "Desc 3", "severity": "medium"}
		response = self.client.post(self.list_url, data)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(BugReport.objects.count(), 3)

	def test_retrieve_bug_report(self):
		url = reverse('bugreport-detail', args=[self.bug1.id])
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['title'], self.bug1.title)

	def test_update_bug_report(self):
		url = reverse('bugreport-detail', args=[self.bug1.id])
		data = {"title": "Bug 1 Updated", "description": "Desc 1 Updated", "severity": "medium"}
		response = self.client.put(url, data)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.bug1.refresh_from_db()
		self.assertEqual(self.bug1.title, "Bug 1 Updated")

	def test_delete_bug_report(self):
		url = reverse('bugreport-detail', args=[self.bug1.id])
		response = self.client.delete(url)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertEqual(BugReport.objects.count(), 1)
