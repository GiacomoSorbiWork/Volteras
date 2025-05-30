"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { uploadFileInChunks } from "@/utils";
import LineChart from "@/components/chart";
import Button from "@/components/buttons";

interface VehicleData {
  id: number;
  timestamp: string;
  speed?: number;
  odometer: number;
  soc: number;
  elevation: number;
  shift_state?: string;
}

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [vehicleId, setVehicleId] = useState<string>("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [data, setData] = useState<VehicleData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageInput, setPageInput] = useState("1");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [initialTimestamp, setInitialTimestamp] = useState("");
  const [finalTimestamp, setFinalTimestamp] = useState("");
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [sortColumn, setSortColumn] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [exportFormat, setExportFormat] = useState("csv");
  const [vehicleIds, setVehicleIds] = useState<string[]>([]);

  // Fetches vehicle data from the backend with current filters, sorting, and pagination.
  // Updates state for data, pagination, and available vehicle IDs.
  const fetchData = async (
    page = 1,
    size = pageSize,
    column = sortColumn,
    direction = sortDirection
  ) => {
    try {
      let url = `${baseUrl}/vehicle_data/?vehicle_id=${vehicleId}&page=${page}&page_size=${size}`;
      if (initialTimestamp)
        url += `&initial_timestamp=${encodeURIComponent(initialTimestamp)}`;
      if (finalTimestamp)
        url += `&final_timestamp=${encodeURIComponent(finalTimestamp)}`;
      if (userTimezone) url += `&timezone=${encodeURIComponent(userTimezone)}`;
      if (column)
        url += `&ordering=${direction === "desc" ? "-" : ""}${column}`;
      const res = await axios.get(url);
      const pages = Math.ceil(res.data.count / pageSize);
      setData(res.data.results);
      setCurrentPage(page);
      setTotalPages(isNaN(pages) || pages < 1 ? 1 : pages);
      setPageInput(page.toString());

      // Extract unique vehicle IDs from the results
      const ids = Array.from(new Set((res.data.vehicleIDs as string[])));
      setVehicleIds(ids);
    } catch (error) {
      setUploadMessage(
        "Failed to fetch data: Backend is offline or unreachable."
      );
    }
  };

  // Handles CSV file upload using chunked upload utility.
  // Sets progress and messages for user feedback.
  const handleCsvUpload = async (file: File) => {
    const name = file?.name.replace(/\.csv$/i, "") || "";
    if (!file || !name) return;
    setUploadProgress(0);
    try {
      await uploadFileInChunks(
        file,
        name,
        setUploadProgress,
        setUploadMessage,
        fetchData
      );
      setVehicleId(name);
      setUploadMessage("CSV uploaded successfully!");
      setTimeout(() => setUploadMessage(""), 4000);
    } catch (error) {
      setUploadMessage(
        "Failed to upload CSV: Backend is offline or unreachable."
      );
      setUploadProgress(null);
    }
  };

  // Handles sorting when a table header is clicked. Toggles direction if same column.
  const handleSort = (column: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === column) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(direction);
    fetchData(1, pageSize, column, direction);
  };

  useEffect(() => {
    fetchData(1, pageSize, sortColumn, sortDirection);
  }, [vehicleId, pageSize, sortColumn, sortDirection]);

  const socChartData = {
    labels: (data || []).map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "SOC (%)",
        data: (data || []).map((d) => d.soc),
        borderColor: "blue",
        backgroundColor: "lightblue",
      },
    ],
  };

  const handleExport = (format: string) => {
    let url = `${baseUrl}/vehicle_data/export/?vehicle_id=${vehicleId}`;
    if (initialTimestamp)
      url += `&initial_timestamp=${encodeURIComponent(initialTimestamp)}`;
    if (finalTimestamp)
      url += `&final_timestamp=${encodeURIComponent(finalTimestamp)}`;
    if (userTimezone) url += `&timezone=${encodeURIComponent(userTimezone)}`;
    if (sortColumn)
      url += `&ordering=${sortDirection === "desc" ? "-" : ""}${sortColumn}`;
    url += `&export=${format}`;
    window.open(url, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start gap-4 py-8 mx-auto max-w-5xl">
      <div className="z-10 w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto text-xl lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Vehicle Dashboard
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-4 w-full">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30 flex-grow"
        >
          <option value="">All Vehicles</option>
          {vehicleIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <div className="flex gap-4">
          <Button id="csv-upload-button" data-testid="csv-upload-button" onClick={() => {
            const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
            if (fileInput) fileInput.click();
          }}>
            Upload CSV
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={async (e) => {
              const file = e.target.files?.[0] || null;
              if (file) {
                console.log("file found");
                await handleCsvUpload(file);
              }
            }}
            className="hidden"
          />
          <select
            className="rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30 dark:text-gray-200 dark:focus:bg-neutral-800/30"
            onChange={(e) => {
              const value = e.target.value;
              if (value && value !== "default") handleExport(value);
              e.target.selectedIndex = 0; // Reset to default
            }}
            defaultValue="default"
          >     
            <option value="default" disabled>Export</option>
            <option value="csv">Export CSV</option>
            <option value="json">Export JSON</option>
            <option value="xlsx">Export Excel</option>
          </select>
        </div>
      </div>

      {uploadProgress !== null ? (
        <div className="w-full flex flex-col gap-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-4 justify-between">
            <p className="text-gray-400 font-medium">{uploadMessage}</p>
            <div className="text-sm text-gray-400">
              Upload Progress: {uploadProgress}%
            </div>
          </div>
        </div>
      ) : (
        uploadMessage && (
          <div className="fixed top-6 right-6 z-50" data-testid="csv-upload-success">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow-lg transition-opacity duration-500">
              {uploadMessage}
            </div>
          </div>
        )
      )}

      {/* Filter controls for timestamp range. Updates state and triggers fetch. */}
      <div className="flex flex-col md:flex-row items-end gap-4 w-full">
        <label className="flex gap-2 text-gray-800 dark:text-gray-200 text-sm flex-col flex-1">
          Initial Timestamp:
          <input
            type="datetime-local"
            value={initialTimestamp}
            onChange={(e) => setInitialTimestamp(e.target.value)}
            className="rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30"
          />
        </label>
        <label className="flex gap-2 text-gray-800 dark:text-gray-200 text-sm flex-col flex-1">
          Final Timestamp:
          <input
            type="datetime-local"
            value={finalTimestamp}
            onChange={(e) => setFinalTimestamp(e.target.value)}
            className="rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30"
          />
        </label>
        <Button onClick={() => fetchData(1, pageSize)}>Apply</Button>
        <Button
          onClick={() => {
            setInitialTimestamp("");
            setFinalTimestamp("");
            setPageInput("1");
            fetchData(1, pageSize);
          }}
        >
          Reset
        </Button>
      </div>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-60 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]"></div>

      <div className="min-h-[250px] w-full border-b border-neutral-light bg-white dark:bg-neutral-900/60 rounded shadow ">
        <table className="min-w-full border-2 rounded overflow-hidden">
          <thead>
            <tr className="bg-neutral-700/30">
              {[
                { key: "timestamp", label: "Timestamp" },
                { key: "speed", label: "Speed" },
                { key: "odometer", label: "Odometer" },
                { key: "soc", label: "SOC" },
                { key: "elevation", label: "Elevation" },
                { key: "shift_state", label: "Shift" },
              ].map((col) => (
                <th
                  key={col.key}
                  className="py-3 px-4 border-b text-left cursor-pointer text-neutral-dark dark:text-neutral-100 hover:text-primary dark:hover:text-primary-light select-none transition"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortColumn === col.key && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
                >
                  <td className="py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 dark:text-neutral-100">
                    {new Date(d.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 dark:text-neutral-100">
                    {d.speed ?? "-"}
                  </td>
                  <td className="py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 dark:text-neutral-100">
                    {d.odometer}
                  </td>
                  <td className="py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 dark:text-neutral-100">
                    {d.soc}
                  </td>
                  <td className="py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 dark:text-neutral-100">
                    {d.elevation}
                  </td>
                  <td className="py-2 px-4 border-b border-neutral-200 dark:border-neutral-700 dark:text-neutral-100">
                    {d.shift_state ?? "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-neutral py-8 dark:text-neutral-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls: allow user to change page and page size. */}
      <div className="flex justify-between gap-4 w-full">
        <div className="flex gap-3 items-center">
          <label
            htmlFor="pageSize"
            className="font-medium text-neutral-800 dark:text-neutral-200"
          >
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30 dark:text-gray-200 dark:focus:bg-neutral-800/30"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option
                className="dark:bg-neutral-800 dark:text-gray-200"
                key={size}
                value={size}
              >
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => fetchData(1, pageSize)}
            disabled={currentPage === 1}
          >
            <span className="inline-block transition-transform group-hover:-translate-x-1 motion-reduce:transform-none">
              &lt;&lt;
            </span>
          </Button>

          <Button
            onClick={() => fetchData(currentPage - 1, pageSize)}
            disabled={currentPage === 1}
          >
            <span className="inline-block transition-transform group-hover:-translate-x-1 motion-reduce:transform-none">
              &lt;
            </span>
          </Button>

          <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
            Page
            <input
              type="number"
              min={1}
              max={isNaN(totalPages) ? 1 : totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                let page = parseInt(pageInput, 10);
                if (isNaN(page) || page < 1) page = 1;
                if (page > totalPages) page = totalPages;
                fetchData(page, pageSize);
              }}
              className="rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30"
            />
            of {totalPages}
          </span>

          <Button
            onClick={() => fetchData(currentPage + 1, pageSize)}
            disabled={currentPage === totalPages}
          >
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              &gt;
            </span>
          </Button>

          <Button
            onClick={() => fetchData(totalPages, pageSize)}
            disabled={currentPage === totalPages}
          >
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              &gt;&gt;
            </span>
          </Button>
        </div>
      </div>

      <LineChart socChartData={socChartData} />
    </main>
  );
}
