from django.urls import path
from .views import VehicleDataListCreateView,  VehicleDataDetailView, VehicleDataChunkUploadView, VehicleDataFinalizeUploadView, VehicleDataExportView

urlpatterns = [
    path('vehicle_data/', VehicleDataListCreateView.as_view(), name='vehicle_data_list_create'),
    path('vehicle_data/<int:pk>/', VehicleDataDetailView.as_view(), name='vehicle_data_detail'),
    path('vehicle_data/upload_chunk/', VehicleDataChunkUploadView.as_view(), name='vehicle_data_upload_chunk'),
    path('vehicle_data/finalize_upload/', VehicleDataFinalizeUploadView.as_view(), name='vehicle_data_finalize_upload'),
    path('vehicle_data/export/', VehicleDataExportView.as_view(), name='vehicle_data_export'),
] 