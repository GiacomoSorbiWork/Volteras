# Generated by Django 5.2.1 on 2025-05-29 18:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vehicle_data', '0001_initial'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='vehicledata',
            constraint=models.UniqueConstraint(fields=('vehicle_id', 'timestamp'), name='unique_vehicle_timestamp'),
        ),
    ]
