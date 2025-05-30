# Unit tests for VehicleDataSerializer: serialization and validation of all fields.
from django.test import TestCase
from .serializers import VehicleDataSerializer
from django.utils import timezone


class VehicleDataSerializerTest(TestCase):
    def test_vehicle_data_serializer_valid(self):
        data = {
            'vehicle_id': 'veh1',
            'timestamp': timezone.now(),
            'odometer': 123.4,
            'soc': 80,
            'elevation': 10.5,
            'speed': 55.0,
            'shift_state': 'D',
        }
        serializer = VehicleDataSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.soc, 80)
        self.assertEqual(instance.odometer, 123.4) 