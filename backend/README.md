# Django Backend for Volteras Vehicle Data Platform

## Overview
This Django backend provides a RESTful API for storing, querying, and exporting vehicle telemetry data. It supports:
- Efficient chunked CSV uploads for large datasets
- Filtering, sorting, and pagination of vehicle data
- Exporting data as CSV, JSON, or Excel
- Robust unit and integration tests

## Tech Stack
- **Django** (>=4.2)
- **Django REST Framework**
- **PostgreSQL** (recommended)
- **pandas** (for export)
- **pytest** (for testing)

## Setup & Installation
1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure database:**
   - By default, uses PostgreSQL. Update `backend_project/settings.py` for your DB settings.
3. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Run the server:**
   ```bash
   python manage.py runserver
   ```

## API Endpoints
All endpoints are prefixed by `/vehicle_data/`:

| Endpoint                        | Method | Description                                      |
|---------------------------------|--------|--------------------------------------------------|
| `/vehicle_data/`                | GET    | List vehicle data (filter, sort, paginate)        |
| `/vehicle_data/`                | POST   | Create a new vehicle data record                  |
| `/vehicle_data/<id>/`           | GET    | Retrieve a single vehicle data record             |
| `/vehicle_data/upload_chunk/`   | POST   | Upload a single chunk of a CSV file               |
| `/vehicle_data/finalize_upload/`| POST   | Finalize upload, process and insert all data      |
| `/vehicle_data/export/`         | GET    | Export filtered data as CSV, JSON, or Excel       |

### Filtering, Sorting, and Pagination
- **Filter by vehicle:** `?vehicle_id=...`
- **Filter by timestamp:** `?initial_timestamp=...&final_timestamp=...`
- **Sort:** `?ordering=timestamp` or `?ordering=-odometer`
- **Pagination:** `?page=2&page_size=20`

### Chunked Upload Workflow
1. Split large CSV into 1MB chunks on the frontend.
2. POST each chunk to `/vehicle_data/upload_chunk/` with `file_name`, `chunk_index`, `total_chunks`, and `vehicle_id`.
3. After all chunks, POST to `/vehicle_data/finalize_upload/` to reassemble, validate, and bulk-insert data.

> **Why chunked upload?**
> Chunking allows uploading very large files without hitting browser or server memory/time limits. The backend efficiently reassembles and streams data into the database.

## Data Model
The main model is `VehicleData`:
- `vehicle_id` (string): Unique vehicle identifier
- `timestamp` (datetime): Timestamp of the data point
- `speed` (float, optional): Vehicle speed
- `odometer` (float): Odometer reading
- `soc` (int): State of charge (%)
- `elevation` (float): Elevation in meters
- `shift_state` (string, optional): Gear/shift state
- **Unique constraint:** (`vehicle_id`, `timestamp`)

## Testing
- **Run all tests:**
  ```bash
  python manage.py test vehicle_data
  ```
- **Test coverage:**
  - Models: creation, unique constraint
  - Serializers: validation, serialization
  - Views: list, create, filtering, ordering, pagination, chunked upload
  - Pagination: custom page size logic

## Example: Using All API Endpoints via Postman

### 1. List Vehicle Data (GET)
- **Method:** GET
- **URL:** `http://localhost:8000/api/v1/vehicle_data/`
- **Query params (optional):**
  - `vehicle_id=veh1`
  - `initial_timestamp=2024-01-01T00:00:00Z`
  - `final_timestamp=2024-01-31T23:59:59Z`
  - `ordering=-timestamp`
  - `page=1&page_size=10`
- **How:** Enter query params in the Params tab. Click **Send**.

### 2. Create Vehicle Data (POST)
- **Method:** POST
- **URL:** `http://localhost:8000/api/v1/vehicle_data/`
- **Body:**
  - Select **raw** and **JSON**
  - Example:
    ```json
    {
      "vehicle_id": "veh1",
      "timestamp": "2024-06-01T12:00:00Z",
      "odometer": 1234.5,
      "soc": 80,
      "elevation": 10.5,
      "speed": 55.0,
      "shift_state": "D"
    }
    ```
- **How:** Click **Send**.

### 3. Retrieve Single Vehicle Data (GET)
- **Method:** GET
- **URL:** `http://localhost:8000/api/v1/vehicle_data/<id>/`
- **How:** Replace `<id>` with the record's ID. Click **Send**.

### 4. Filter, Sort, and Paginate (GET)
- **Method:** GET
- **URL:** `http://localhost:8000/api/v1/vehicle_data/`
- **Params:**
  - `vehicle_id=veh1`
  - `ordering=odometer`
  - `page=2&page_size=5`
- **How:** Enter params in the Params tab. Click **Send**.

### 5. Export Data (GET)
- **Method:** GET
- **URL:** `http://localhost:8000/api/v1/vehicle_data/export/`
- **Params:**
  - `vehicle_id=veh1`
  - `export=csv` (or `json`, `xlsx`)
- **How:** Enter params in the Params tab. Click **Send**. The file will download.

### 6. Chunked Upload (POST)

#### a. Upload a File Chunk
- **Method:** POST
- **URL:** `http://localhost:8000/api/v1/vehicle_data/upload_chunk/`
- **Body:**
  - Select **form-data**
  - Add the following fields:
    - `chunk`: (type: File) Select your chunk file (e.g., `chunk0.csv`)
    - `file_name`: (type: Text) `myfile.csv`
    - `chunk_index`: (type: Text) `0` (increment for each chunk)
    - `total_chunks`: (type: Text) `3` (total number of chunks)
    - `vehicle_id`: (type: Text) `veh1`
- **How:**
  1. In Postman, go to the Body tab and select `form-data`.
  2. For the `chunk` field, change the type from `Text` to `File` and select your file chunk.
  3. Fill in the other fields as `Text`.
  4. Click **Send**.
  5. Repeat for each chunk, incrementing `chunk_index` each time.

**Example:**
| Key         | Type | Value           |
|-------------|------|----------------|
| chunk       | File | chunk0.csv      |
| file_name   | Text | myfile.csv      |
| chunk_index | Text | 0               |
| total_chunks| Text | 3               |
| vehicle_id  | Text | veh1            |

#### b. Finalize the Upload
- **Method:** POST
- **URL:** `http://localhost:8000/api/v1/vehicle_data/finalize_upload/`
- **Body:**
  - Select **raw** and **JSON**
  - Example:
    ```json
    {
      "file_name": "myfile.csv",
      "total_chunks": 3,
      "vehicle_id": "veh1"
    }
    ```
- **How:**
  1. In Postman, go to the Body tab and select `raw` and `JSON`.
  2. Paste the JSON above, adjusting values as needed.
  3. Click **Send**.

---

You can use these examples in Postman to test all main API features. Adjust field values and parameters as needed for your data.
