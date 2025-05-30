from django.db import models

# Create your models here.

# VehicleData model stores telemetry for each vehicle at a given timestamp.
# Each (vehicle_id, timestamp) pair is unique to prevent duplicate records.
class VehicleData(models.Model):
    vehicle_id = models.CharField(max_length=100, db_index=True)  # Unique vehicle identifier
    timestamp = models.DateTimeField(db_index=True)  # Timestamp of the data point
    speed = models.FloatField(null=True, blank=True)  # Vehicle speed (optional)
    odometer = models.FloatField()  # Odometer reading
    soc = models.IntegerField()  # State of charge (%)
    elevation = models.FloatField()  # Elevation in meters
    shift_state = models.CharField(max_length=20, null=True, blank=True)  # Gear/shift state (optional)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['vehicle_id', 'timestamp'], name='unique_vehicle_timestamp')  # Prevent duplicate records
        ]

    def __str__(self):
        return f"{self.vehicle_id} @ {self.timestamp}"
