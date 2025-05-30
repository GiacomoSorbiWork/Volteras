import axios from "axios";
import { Dispatch, SetStateAction } from "react";

// Chunked upload utility for large CSV files. This allows uploading big files without hitting server or browser limits.
// Each chunk is sent sequentially, and progress is tracked for user feedback.
// After all chunks are sent, a finalize call tells the backend to assemble the file and process it.
const CHUNK_SIZE = 1024 * 1024; // 1MB per chunk
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
export const uploadFileInChunks = async (
  file: File,
  vehicleId: string,
  setUploadProgress: Dispatch<SetStateAction<number | null>>,
  setUploadMessage: Dispatch<SetStateAction<string>>,
  fetchData: (
    page?: number,
    size?: number,
    column?: string,
    direction?: "asc" | "desc"
  ) => Promise<void>
) => {
  // Calculate how many chunks the file will be split into
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    // Slice out the current chunk from the file
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("file_name", file.name);
    formData.append("chunk_index", i.toString());
    formData.append("total_chunks", totalChunks.toString());
    formData.append("vehicle_id", vehicleId);
    // Upload the chunk to the backend
    await axios.post(
      `${baseUrl}/vehicle_data/upload_chunk/`,
      formData
    );
    // Update progress for the user
    setUploadProgress(Math.round(((i + 1) * 100) / totalChunks));
  }
  // After all chunks are uploaded, tell the backend to finalize and process the file
  await axios.post(
    `${baseUrl}/vehicle_data/finalize_upload/`,
    {
      file_name: file.name,
      total_chunks: totalChunks,
      vehicle_id: vehicleId,
    }
  );
  setUploadMessage("CSV data loaded and processed successfully");
  setUploadProgress(null);
  fetchData();
};
