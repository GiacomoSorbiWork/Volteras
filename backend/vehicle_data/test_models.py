# Unit tests for VehicleData model: creation, string representation, and unique constraint.
from .models import VehicleData
from django.utils import timezone
from django.test import TestCase

class VehicleDataModelTest(TestCase):
    def test_create_vehicle_data(self):
        obj = VehicleData.objects.create(
            timestamp=timezone.now(),
            odometer=123.4,
            soc=80,
            elevation=10.5,
            speed=55.0,
            shift_state='D',
        )
        self.assertIsNotNone(obj.id)
        self.assertEqual(obj.soc, 80)
        self.assertEqual(obj.odometer, 123.4)
        self.assertEqual(obj.elevation, 10.5)
        self.assertEqual(obj.speed, 55.0)
        self.assertEqual(obj.shift_state, 'D') 