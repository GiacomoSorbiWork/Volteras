from rest_framework import serializers
from .models import VehicleData

# Serializer for VehicleData model. Serializes all fields for API input/output.
class VehicleDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleData
        fields = '__all__' 