from django.shortcuts import render
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import VehicleData
from .serializers import VehicleDataSerializer
import csv
from django.utils.dateparse import parse_datetime
from django.core.files.storage import default_storage
import os
from django.conf import settings
import psycopg2
from django.db import connection
import logging
from .pagination import CustomPageNumberPagination
from django.utils import timezone
from datetime import timezone as dt_timezone
from .utils import ensure_aware_utc
from dateutil import parser as dateutil_parser
from pytz import timezone as pytz_timezone
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
import pandas as pd
from django.http import HttpResponse
import io
import json
from django.core.serializers.json import DjangoJSONEncoder

# Create your views here.

logger = logging.getLogger(__name__)

# VehicleDataListCreateView: Handles listing and creating vehicle data records.
# Supports filtering by vehicle_id, timestamp range, ordering, and pagination.
class VehicleDataListCreateView(generics.ListCreateAPIView):
    queryset = VehicleData.objects.all()
    serializer_class = VehicleDataSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'speed', 'odometer', 'soc', 'elevation', 'shift_state']
    ordering = ['timestamp']
    pagination_class = CustomPageNumberPagination
    
    def get(self, request, *args, **kwargs):
        # GET: List vehicle data with filters, ordering, and pagination.
        # Adds unique vehicle IDs to the response for frontend dropdowns.
        logger.info("VehicleDataListCreateView GET called")
        logger.info(request.query_params)
        response = super().get(request, *args, **kwargs)
        # Add unique vehicle IDs to the response
        vehicle_ids = VehicleData.objects.values_list('vehicle_id', flat=True).distinct()
        if hasattr(response, 'data') and isinstance(response.data, dict):
            response.data['vehicleIDs'] = list(vehicle_ids)
        return response

    def get_queryset(self):
        # Build queryset with optional filters for vehicle_id, timestamp range, and ordering.
        # Handles timezone-aware filtering for timestamps.
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get('vehicle_id')
        initial_timestamp = self.request.query_params.get('initial_timestamp')
        final_timestamp = self.request.query_params.get('final_timestamp')
        ordering = self.request.query_params.get('ordering')
        user_timezone = self.request.query_params.get('timezone')
        logger.info(f"initial_timestamp={initial_timestamp}, final_timestamp={final_timestamp}, user_timezone={user_timezone}")
        tz = None
        if user_timezone:
            try:
                tz = pytz_timezone(user_timezone)
            except Exception:
                logger.warning(f"Invalid timezone provided: {user_timezone}")
                tz = None
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if initial_timestamp:
            dt = parse_any_datetime(initial_timestamp)
            logger.info(f"Parsed initial_timestamp: {dt}")
            if dt and tz:
                dt = tz.localize(dt) if timezone.is_naive(dt) else dt.astimezone(tz)
                dt = dt.astimezone(dt_timezone.utc)
            dt = ensure_aware_utc(dt)
            if dt:
                queryset = queryset.filter(timestamp__gte=dt)
        if final_timestamp:
            dt = parse_any_datetime(final_timestamp)
            logger.info(f"Parsed final_timestamp: {dt}")
            if dt and tz:
                dt = tz.localize(dt) if timezone.is_naive(dt) else dt.astimezone(tz)
                dt = dt.astimezone(dt_timezone.utc)
            dt = ensure_aware_utc(dt)
            if dt:
                queryset = queryset.filter(timestamp__lte=dt)
        if ordering:
            queryset = queryset.order_by(ordering)
        logger.info(f"Final queryset SQL: {str(queryset.query)}")
        return queryset

# VehicleDataExportView: Exports filtered vehicle data as CSV, JSON, or Excel.
class VehicleDataExportView(APIView):
    def get(self, request, *args, **kwargs):
        # GET: Export vehicle data in the requested format (csv, json, xlsx).
        # Uses same filtering logic as list view.
        export_format = request.query_params.get('export', 'csv')
        # Use the same filtering logic as get_queryset
        view = VehicleDataListCreateView()
        view.request = request
        queryset = view.get_queryset()
        data = list(queryset.values())
        vehicle_id = request.query_params.get('vehicle_id', 'vehicle_data')
        filename_base = vehicle_id if vehicle_id else 'vehicle_data'
        if export_format == 'json':
            response = HttpResponse(
                json.dumps(data, cls=DjangoJSONEncoder),
                content_type='application/json'
            )
            response['Content-Disposition'] = f'attachment; filename={filename_base}.json'
            return response
        elif export_format == 'xlsx':
            df = pd.DataFrame(data)
            for col in df.select_dtypes(include=['datetimetz']).columns:
                df[col] = df[col].dt.tz_localize(None)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False)
            output.seek(0)
            response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename={filename_base}.xlsx'
            return response
        else:  # CSV
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename={filename_base}.csv'
            writer = csv.writer(response)
            if data:
                writer.writerow(data[0].keys())
                for row in data:
                    writer.writerow(row.values())
            return response

# VehicleDataDetailView: Retrieve a single vehicle data record by ID.
class VehicleDataDetailView(generics.RetrieveAPIView):
    queryset = VehicleData.objects.all()
    serializer_class = VehicleDataSerializer

    def retrieve(self, request, *args, **kwargs):
        logger.info("VehicleDataDetailView accessed")
        return super().retrieve(request, *args, **kwargs)

# VehicleDataChunkUploadView: Receives a single file chunk and saves it to disk.
# Used for chunked CSV uploads to support large files.
class VehicleDataChunkUploadView(APIView):
    def post(self, request, *args, **kwargs):
        # POST: Save a single chunk to a temporary directory.
        chunk = request.FILES['chunk']
        file_name = request.POST['file_name']
        print(file_name)
        chunk_index = request.POST['chunk_index']
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks')
        os.makedirs(temp_dir, exist_ok=True)
        chunk_path = os.path.join(temp_dir, f'{file_name}_part_{chunk_index}')
        with open(chunk_path, 'wb') as f:
            for c in chunk.chunks():
                f.write(c)
        return Response({'status': 'chunk received'})

# VehicleDataFinalizeUploadView: Reassembles chunks, processes CSV, and bulk inserts data.
# Handles validation, adds vehicle_id, and streams data into PostgreSQL efficiently.
class VehicleDataFinalizeUploadView(APIView):
    def post(self, request, *args, **kwargs):
        # POST: Reassemble file, validate CSV, add vehicle_id, and stream insert into DB.
        # Cleans up temp files after processing.
        file_name = request.data['file_name']
        total_chunks = int(request.data['total_chunks'])
        vehicle_id = request.data['vehicle_id']
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks')
        final_path = os.path.join(temp_dir, file_name)
        temp_csv_path = final_path + '.with_id.csv'
        print(temp_csv_path)

        try:
            # Reassemble
            logger.info(f"Reassembling {file_name} from {total_chunks} chunks.")
            with open(final_path, 'wb') as final_file:
                for i in range(total_chunks):
                    chunk_path = os.path.join(temp_dir, f'{file_name}_part_{i}')
                    with open(chunk_path, 'rb') as chunk_file:
                        final_file.write(chunk_file.read())
                    os.remove(chunk_path)

            # Prepare temp CSV with vehicle_id
            logger.info(f"Creating temp CSV with vehicle_id for {file_name}.")
            with open(final_path, 'r', encoding='utf-8') as infile, open(temp_csv_path, 'w', encoding='utf-8', newline='') as outfile:
                reader = csv.DictReader(infile)
                if not reader.fieldnames or set(['timestamp', 'speed', 'odometer', 'soc', 'elevation', 'shift_state']) - set(reader.fieldnames):
                    logger.error("CSV header missing required columns.")
                    return Response({'detail': 'CSV header missing required columns.'}, status=status.HTTP_400_BAD_REQUEST)
                fieldnames = reader.fieldnames + ['vehicle_id']
                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()
                for row in reader:
                    # Convert 'NULL' (case-insensitive) to empty string for all fields
                    for k, v in row.items():
                        if isinstance(v, str) and v.strip().upper() == "NULL":
                            row[k] = ""
                    row['vehicle_id'] = vehicle_id
                    writer.writerow(row)

            # Streaming insert
            logger.info(f"Streaming insert into PostgreSQL for {file_name}.")
            with connection.cursor() as cur, open(temp_csv_path, 'r', encoding='utf-8') as f:
                next(f)  # skip header
                cur.execute("""
                CREATE TEMP TABLE temp_vehicle_data (
                    timestamp TIMESTAMPTZ,
                    speed FLOAT,
                    odometer FLOAT,
                    soc FLOAT,
                    elevation FLOAT,
                    shift_state VARCHAR,
                    vehicle_id VARCHAR
                )
                """)
                sql = """
                COPY temp_vehicle_data (timestamp, speed, odometer, soc, elevation, shift_state, vehicle_id)
                FROM STDIN WITH (FORMAT CSV)
                """
                cur.copy_expert(sql, f)

                cur.execute("""
                INSERT INTO vehicle_data_vehicledata (timestamp, speed, odometer, soc, elevation, shift_state, vehicle_id)
                SELECT timestamp, speed, odometer, soc, elevation, shift_state, vehicle_id
                FROM temp_vehicle_data
                ON CONFLICT (timestamp, vehicle_id) DO NOTHING
                """)

            logger.info(f"Successfully processed {file_name}.")

            return Response({'status': 'file reassembled and processed (streaming insert)'})

        except Exception as e:
            logger.exception(f"Error processing {file_name}: {e}")
            return Response({'detail': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Cleanup temp files
            if os.path.exists(final_path):
                os.remove(final_path)
            if os.path.exists(temp_csv_path):
                os.remove(temp_csv_path)

# parse_any_datetime: Helper to parse datetimes from query params.
def parse_any_datetime(dt_str):
    try:
        return dateutil_parser.parse(dt_str)
    except Exception:
        return None
