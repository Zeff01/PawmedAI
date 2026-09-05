"""
The pet-owner records: pets, weights, vaccinations, medications and doses,
appointments, documents, and the care timeline.

Numbered 0003 on purpose. An earlier version of this app shipped 0001 and 0002
and was then deleted from the source tree, but both are still recorded in
`django_migrations` on the live database — so starting again at 0001 would look
already-applied and silently create nothing. Continuing the sequence keeps that
history honest and lets this apply cleanly.

The `pet_profiles_petprofile` table those migrations left behind is untouched
here; dropping it is a separate, deliberate decision.
"""


import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    # Not `initial`: see the module docstring — 0001 and 0002 are recorded on
    # the live database even though their files are gone.
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Pet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('species', models.CharField(choices=[('dog', 'Dog'), ('cat', 'Cat'), ('other', 'Other')], default='dog', max_length=16)),
                ('breed', models.CharField(blank=True, max_length=120)),
                ('photo_url', models.URLField(blank=True, max_length=500)),
                ('birth_date', models.DateField(blank=True, help_text='Used to derive the age shown on the card.', null=True)),
                ('sex', models.CharField(choices=[('male', 'Male'), ('female', 'Female'), ('unknown', 'Unknown')], default='unknown', max_length=16)),
                ('neuter_status', models.CharField(choices=[('intact', 'Intact'), ('neutered', 'Neutered'), ('spayed', 'Spayed'), ('unknown', 'Unknown')], default='unknown', max_length=16)),
                ('ideal_weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('microchip_number', models.CharField(blank=True, max_length=64)),
                ('insurance_provider', models.CharField(blank=True, max_length=120)),
                ('insurance_policy', models.CharField(blank=True, max_length=120)),
                ('indoor_only', models.BooleanField(default=False)),
                ('is_favourite', models.BooleanField(default=False)),
                ('clinic_name', models.CharField(blank=True, max_length=160)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fur_parent_pets', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-is_favourite', 'name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='Medication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=160)),
                ('detail', models.CharField(blank=True, max_length=250)),
                ('form', models.CharField(choices=[('pill', 'Pill or tablet'), ('chew', 'Soft chew'), ('topical', 'Topical'), ('liquid', 'Liquid')], default='pill', max_length=16)),
                ('cadence', models.CharField(choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('quarterly', 'Every 3 months'), ('as_needed', 'As needed')], default='monthly', max_length=16)),
                ('next_due_on', models.DateField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='medications', to='pet_profiles.pet')),
            ],
            options={
                'ordering': ['-is_active', 'next_due_on', 'name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='CareEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('weight', 'Weight logged'), ('dose', 'Medication given'), ('vaccination', 'Vaccination recorded'), ('appointment', 'Appointment booked'), ('document', 'Document uploaded'), ('pet', 'Pet added')], max_length=16)),
                ('title', models.CharField(max_length=250)),
                ('detail', models.CharField(blank=True, max_length=400)),
                ('occurred_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('pet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='care_events', to='pet_profiles.pet')),
            ],
            options={
                'ordering': ['-occurred_at', '-id'],
            },
        ),
        migrations.CreateModel(
            name='Appointment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('clinic', models.CharField(blank=True, max_length=160)),
                ('vet_name', models.CharField(blank=True, max_length=160)),
                ('vet_role', models.CharField(blank=True, max_length=120)),
                ('starts_at', models.DateTimeField()),
                ('address', models.CharField(blank=True, max_length=250)),
                ('status', models.CharField(choices=[('booked', 'Booked'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='booked', max_length=16)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='pet_profiles.pet')),
            ],
            options={
                'ordering': ['starts_at', 'id'],
            },
        ),
        migrations.CreateModel(
            name='PetDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=200)),
                ('kind', models.CharField(choices=[('lab', 'Lab result'), ('insurance', 'Insurance'), ('certificate', 'Certificate'), ('other', 'Other')], default='lab', max_length=16)),
                ('file', models.FileField(upload_to='pet-documents/%Y/%m/')),
                ('note', models.CharField(blank=True, max_length=250)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('pet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='pet_profiles.pet')),
            ],
            options={
                'ordering': ['-uploaded_at', '-id'],
            },
        ),
        migrations.CreateModel(
            name='Vaccination',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=160)),
                ('administered_on', models.DateField(blank=True, null=True)),
                ('due_on', models.DateField(blank=True, help_text='When the next dose is due, or when this one expires.', null=True)),
                ('clinic', models.CharField(blank=True, max_length=160)),
                ('notes', models.CharField(blank=True, max_length=250)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vaccinations', to='pet_profiles.pet')),
            ],
            options={
                'ordering': ['due_on', 'name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='WeightEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weight_kg', models.DecimalField(decimal_places=2, max_digits=6, validators=[django.core.validators.MinValueValidator(0)])),
                ('recorded_on', models.DateField(default=django.utils.timezone.localdate)),
                ('note', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('pet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weight_entries', to='pet_profiles.pet')),
            ],
            options={
                'ordering': ['-recorded_on', '-id'],
            },
        ),
        migrations.CreateModel(
            name='MedicationDose',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('given_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('note', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('medication', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doses', to='pet_profiles.medication')),
            ],
            options={
                'ordering': ['-given_at', '-id'],
                'indexes': [models.Index(fields=['medication', '-given_at'], name='pet_profile_medicat_8ef855_idx')],
            },
        ),
        migrations.AddIndex(
            model_name='pet',
            index=models.Index(fields=['owner', 'name'], name='pet_profile_owner_i_da57dc_idx'),
        ),
        migrations.AddIndex(
            model_name='medication',
            index=models.Index(fields=['pet', 'is_active'], name='pet_profile_pet_id_6d3582_idx'),
        ),
        migrations.AddIndex(
            model_name='careevent',
            index=models.Index(fields=['pet', '-occurred_at'], name='pet_profile_pet_id_f901a3_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['pet', 'starts_at'], name='pet_profile_pet_id_8fc1d9_idx'),
        ),
        migrations.AddIndex(
            model_name='petdocument',
            index=models.Index(fields=['pet', '-uploaded_at'], name='pet_profile_pet_id_a2c96b_idx'),
        ),
        migrations.AddIndex(
            model_name='vaccination',
            index=models.Index(fields=['pet', 'due_on'], name='pet_profile_pet_id_78fbf9_idx'),
        ),
        migrations.AddIndex(
            model_name='weightentry',
            index=models.Index(fields=['pet', '-recorded_on'], name='pet_profile_pet_id_f72399_idx'),
        ),
    ]
