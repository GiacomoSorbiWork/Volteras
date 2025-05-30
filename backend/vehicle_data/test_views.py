# API tests for vehicle data endpoints: list, create, filtering, ordering, pagination, and chunked upload.
from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.utils import timezone, dateparse
from .models import VehicleData
import datetime

class VehicleDataAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def create_vehicle_data(self, **kwargs):
        """Helper to create VehicleData with sensible defaults."""
        defaults = dict(
            timestamp=timezone.now(),
            odometer=100,
            soc=90,
            elevation=5,
            vehicle_id='veh1',
        )
        defaults.update(kwargs)
        return VehicleData.objects.create(**defaults)

    def test_vehicle_data_filter_by_vehicle_id(self):
        """Should return only data for the specified vehicle_id."""
        self.create_vehicle_data(vehicle_id='veh1')
        self.create_vehicle_data(vehicle_id='veh2')
        url = reverse('vehicle_data_list_create')
        response = self.client.get(url, {'vehicle_id': 'veh2'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(item['vehicle_id'] == 'veh2' for item in response.data['results']))

    def test_vehicle_data_ordering(self):
        """Should order results by odometer ascending."""
        t1 = timezone.now() - datetime.timedelta(days=1)
        t2 = timezone.now()
        self.create_vehicle_data(timestamp=t1, odometer=1)
        self.create_vehicle_data(timestamp=t2, odometer=2)
        url = reverse('vehicle_data_list_create')
        response = self.client.get(url, {'ordering': 'odometer'})
        self.assertEqual(response.status_code, 200)
        odometers = [item['odometer'] for item in response.data['results']]
        self.assertEqual(odometers, sorted(odometers))

    def test_vehicle_data_pagination(self):
        """Should paginate results and respect page/page_size params."""
        for i in range(15):
            self.create_vehicle_data(odometer=i, timestamp=timezone.now() + datetime.timedelta(seconds=i))
        url = reverse('vehicle_data_list_create')
        response = self.client.get(url, {'page': 2, 'page_size': 10})
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 15)
        self.assertLessEqual(len(response.data['results']), 10)

    def test_vehicle_data_filter_by_timestamp(self):
        """Should filter by initial_timestamp and final_timestamp params."""
        t1 = timezone.now() - datetime.timedelta(days=2)
        t2 = timezone.now() - datetime.timedelta(days=1)
        t3 = timezone.now()
        self.create_vehicle_data(timestamp=t1)
        self.create_vehicle_data(timestamp=t2)
        self.create_vehicle_data(timestamp=t3)
        url = reverse('vehicle_data_list_create')
        # Filter for records >= t2
        response = self.client.get(url, {'initial_timestamp': t2.isoformat()})
        self.assertEqual(response.status_code, 200)
        for item in response.data['results']:
            self.assertGreaterEqual(dateparse.parse_datetime(item['timestamp']), t2)
        # Filter for records <= t2
        response = self.client.get(url, {'final_timestamp': t2.isoformat()})
        self.assertEqual(response.status_code, 200)
        for item in response.data['results']:
            self.assertLessEqual(dateparse.parse_datetime(item['timestamp']), t2)

    def test_vehicle_data_vehicleIDs_in_response(self):
        """Should include all unique vehicleIDs in the response."""
        self.create_vehicle_data(vehicle_id='vehicle1')
        self.create_vehicle_data(vehicle_id='vehicle2')
        url = reverse('vehicle_data_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('vehicleIDs', response.data)
        self.assertTrue(set(response.data['vehicleIDs']) >= {'vehicle1', 'vehicle2'})

    def test_vehicle_data_list(self):
        """Should return a list of vehicle data objects."""
        VehicleData.objects.create(
            timestamp=timezone.now(),
            odometer=100,
            soc=90,
            elevation=5,
        )
        url = reverse('vehicle_data_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_vehicle_data_create(self):
        """Should create a new vehicle data object via POST."""
        url = reverse('vehicle_data_list_create')
        data = {
            'vehicle_id': 'veh1',
            'timestamp': timezone.now().isoformat(),
            'odometer': 200,
            'soc': 85,
            'elevation': 15,
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, (200, 201))
        self.assertTrue(VehicleData.objects.filter(odometer=200).exists()) 