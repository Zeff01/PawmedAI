from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ClassificationThrottleMeta",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scope", models.CharField(max_length=64)),
                ("ident", models.CharField(max_length=255)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("user_first_name", models.CharField(blank=True, max_length=150)),
                ("last_seen_ph", models.DateTimeField()),
                ("next_reset_ph", models.DateTimeField()),
                ("last_seen_ph_display", models.CharField(max_length=32)),
                ("next_reset_ph_display", models.CharField(max_length=32)),
                ("bucket_hours", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["scope", "ident"], name="classify_d_scope_i_8f45f6_idx"),
                ],
                "unique_together": {("scope", "ident")},
            },
        ),
    ]
