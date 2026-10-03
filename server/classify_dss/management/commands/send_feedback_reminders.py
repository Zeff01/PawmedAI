"""Push the "did the vet confirm it?" reminders that have come due.

Nothing in the app runs this on its own — schedule it, e.g. hourly:

    python manage.py send_feedback_reminders

Each reminder is pushed once. It stays on the user's dashboard either way, so
someone without notifications turned on still sees it next time they visit.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from classify_dss.models import ClassificationRecord, FeedbackReminder
from notifications.push import send_to_user


class Command(BaseCommand):
    help = "Send push notifications for feedback reminders that are due."

    def handle(self, *args, **options):
        due = FeedbackReminder.objects.filter(
            remind_at__lte=timezone.now(), notified_at__isnull=True
        ).select_related("record", "user")

        sent = 0
        for reminder in due:
            record = reminder.record
            subject = record.diagnosis or "your pet's result"
            if record.kind == ClassificationRecord.Kind.BREED:
                body = f"Was {subject} the right breed? Tap to let us know."
            else:
                body = f"Did the vet confirm {subject}? Tap to tell us."
            try:
                reached = send_to_user(
                    reminder.user,
                    title="How did the vet visit go?",
                    body=body,
                    url=f"/classify/feedback/{record.id}",
                )
            except RuntimeError as exc:
                # Push is not configured here; the dashboard still shows it.
                self.stderr.write(str(exc))
                return
            # Marked either way: a user with no devices shouldn't be retried hourly.
            reminder.notified_at = timezone.now()
            reminder.save(update_fields=["notified_at"])
            sent += reached

        self.stdout.write(
            self.style.SUCCESS(f"{sent} notifications sent.")
        )
