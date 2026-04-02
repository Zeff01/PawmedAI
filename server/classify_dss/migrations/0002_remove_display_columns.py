from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("classify_dss", "0001_classification_throttle_meta"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="classificationthrottlemeta",
            name="last_seen_ph_display",
        ),
        migrations.RemoveField(
            model_name="classificationthrottlemeta",
            name="next_reset_ph_display",
        ),
    ]
