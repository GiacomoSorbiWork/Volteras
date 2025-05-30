# Volteras Challenge Frontend

A modern, high-performance dashboard for vehicle data, built with Next.js, React, TypeScript, and Tailwind CSS.

---

## 🚀 Technologies Used

- **Next.js**: React framework for server-side rendering, static site generation, and routing.
- **React**: UI library for building reusable, component-based interfaces.
- **TypeScript**: Adds static typing to JavaScript for safer, more maintainable code.
- **Tailwind CSS**: Utility-first CSS framework for rapid, consistent UI development.
- **Chart.js & react-chartjs-2**: For rich, interactive data visualizations.
- **Axios**: Promise-based HTTP client for API requests.
- **Jest & @testing-library/react**: For robust, user-focused unit and integration testing.
- **@testing-library/jest-dom**: Custom DOM matchers for more expressive test assertions.
- **ts-jest**: TypeScript preprocessor for Jest.
> **🚩 The frontend uses a chunked upload function to efficiently upload large CSV files in smaller pieces, improving reliability and user experience for big data uploads.**

### Why these technologies?
- **Next.js** provides fast, SEO-friendly, and scalable web apps with minimal config.
- **TypeScript** improves code quality and developer experience.
- **Tailwind CSS** enables rapid UI development with minimal custom CSS.
- **Jest & Testing Library** ensure reliability and maintainability through user-centric tests.
> **🚩 Chunked upload allows handling of very large files without running into browser or network limitations, making the app suitable for big data scenarios.**

---

## 📁 Project Structure

```
frontend_nextjs/
├── src/
│   ├── app/           # Main app pages and logic
│   ├── components/    # Reusable UI components (Button, Chart, etc.)
│   └── utils/         # Utility functions (e.g., file upload)
├── public/            # Static assets
├── jest.config.js     # Jest config (using next/jest)
├── package.json       # Project metadata and scripts
└── README.md          # This file
```

---

## 📝 Key Code Explanations

Below are explanations and annotated code snippets for the most important parts of the frontend:

### 1. Chunked File Upload
**Purpose:** Efficiently uploads large CSV files in smaller pieces to avoid browser/memory/network issues.

```tsx
// src/utils/uploadFileInChunks.ts
/**
 * Uploads a file in chunks to the backend.
 * @param file - The file to upload
 * @param name - The base name for the file
 * @param setProgress - Callback to update upload progress
 * @param setMessage - Callback to update UI message
 * @param onSuccess - Callback to refresh data after upload
 */
export async function uploadFileInChunks(file, name, setProgress, setMessage, onSuccess) {
  // ...splits file into chunks and uploads each chunk sequentially...
  // Calls setProgress(percent) after each chunk
  // Calls setMessage('CSV uploaded successfully!') on success
  // Calls onSuccess() to refresh data
}
```
**Why:**  Chunked upload is essential for handling big data files, improving reliability and user experience.

---

### 2. Filtering, Sorting, and Pagination Logic
**Purpose:** Fetches filtered, sorted, and paginated data from the backend based on user input.

```tsx
// src/app/page.tsx (inside Home component)
const fetchData = async (
  page = 1,
  size = pageSize,
  column = sortColumn,
  direction = sortDirection
) => {
  let url = `${baseUrl}/vehicle_data/?vehicle_id=${vehicleId}&page=${page}&page_size=${size}`;
  if (initialTimestamp) url += `&initial_timestamp=${encodeURIComponent(initialTimestamp)}`;
  if (finalTimestamp) url += `&final_timestamp=${encodeURIComponent(finalTimestamp)}`;
  if (userTimezone) url += `&timezone=${encodeURIComponent(userTimezone)}`;
  if (column) url += `&ordering=${direction === "desc" ? "-" : ""}${column}`;
  // Fetches data and updates state
  const res = await axios.get(url);
  setData(res.data.results);
  setCurrentPage(page);
  setTotalPages(Math.ceil(res.data.count / pageSize));
  setPageInput(page.toString());
  setVehicleIds(Array.from(new Set(res.data.vehicleIDs)));
};
```
**Why:**  This function centralizes all data fetching logic, making it easy to keep the UI in sync with user filters, sorts, and pagination.

---

### 3. CSV Upload UI and Handler
**Purpose:** Provides a user interface for uploading CSV files and triggers the chunked upload logic.

```tsx
// src/app/page.tsx (inside Home component)
<Button
  id="csv-upload-button"
  data-testid="csv-upload-button"
  onClick={() => {
    const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
    if (fileInput) fileInput.click();
  }}
>
  Upload CSV
</Button>
<input
  id="csv-upload"
  type="file"
  accept=".csv"
  onChange={async (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      await handleCsvUpload(file);
    }
  }}
  className="hidden"
/>
```
**Why:**  This pattern separates the visible button from the hidden file input, providing a better user experience and easier testing.

---

### 4. Filter Controls and Apply Button
**Purpose:** Lets users filter data by date range and applies the filter by calling `fetchData`.

```tsx
// src/app/page.tsx (inside Home component)
<label>
  Initial Timestamp:
  <input
    type="datetime-local"
    value={initialTimestamp}
    onChange={(e) => setInitialTimestamp(e.target.value)}
  />
</label>
<label>
  Final Timestamp:
  <input
    type="datetime-local"
    value={finalTimestamp}
    onChange={(e) => setFinalTimestamp(e.target.value)}
  />
</label>
<Button onClick={() => fetchData(1, pageSize)}>Apply</Button>
```
**Why:**  This makes it easy for users to filter data and ensures the UI always reflects the current filter state.

---

### 5. Pagination Controls
**Purpose:** Lets users change pages and page size, triggering new data fetches.

```tsx
// src/app/page.tsx (inside Home component)
<input
  type="number"
  min={1}
  max={totalPages}
  value={pageInput}
  onChange={(e) => setPageInput(e.target.value)}
  onBlur={() => {
    let page = parseInt(pageInput, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    fetchData(page, pageSize);
  }}
/>
<select
  value={pageSize}
  onChange={(e) => setPageSize(Number(e.target.value))}
>
  {[5, 10, 20, 50, 100].map((size) => (
    <option key={size} value={size}>{size}</option>
  ))}
</select>
```
**Why:**  This approach ensures that pagination is accessible, testable, and always triggers the correct data fetch.

---

## 🛠️ How to Run and Build

### Setup
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd frontend_nextjs
   ```
2. **Install dependencies:**
   ```sh
   yarn install
   # or
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and set your API base URL and any other secrets.

### Development
```sh
yarn dev
# or
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build
```sh
yarn build
# or
npm run build
```
- Then start the production server:
```sh
yarn start
# or
npm start
```

### Linting
```sh
yarn lint
# or
npm run lint
```

### Running Tests
```sh
yarn test
# or
npm test
```

---

## 🧪 Unit & Integration Tests (Detailed)

This project includes comprehensive unit and integration tests to ensure reliability and maintainability.

### What is tested?
- **Component Rendering:**  
  Ensures the main dashboard, table, chart, and UI elements render as expected.
- **CSV Upload Functionality:**  
  Mocks the file upload process and verifies that the upload progress and success messages are shown.  
  Ensures the upload function (`uploadFileInChunks`) is called and the UI updates accordingly.
- **Filtering Functionality:**  
  Simulates user input for date filters and checks that only the filtered data is displayed.  
  Verifies that the correct API calls are made with the expected parameters.
- **Pagination and Sorting:**  
  Tests changing page size and sorting columns, ensuring the UI and data update as expected.
- **API Integration:**  
  Mocks API responses (using axios) to test how the UI responds to different backend data scenarios.
- **Error Handling:**  
  Simulates backend errors and checks that user-friendly error messages are displayed.

### Where are the tests?
- All tests are located in `src/app/page.test.tsx` and use [React Testing Library](https://testing-library.com/) and [Jest](https://jestjs.io/).

### Example tested functions/components
- **Home component:**  
  Renders dashboard, handles state, and orchestrates data fetching and filtering.
- **fetchData:**  
  Called on filter, sort, and pagination actions; tested via UI interactions and API mocks.
- **handleCsvUpload:**  
  Tested by simulating file input and checking for progress and success UI.
- **Filtering UI:**  
  Date pickers and filter button tested for correct API call and data rendering.

### How to run the tests
```sh
yarn test
# or
npm test
```

---

### 📋 Example Test Scenarios & Code

#### 1. CSV Upload Success
Simulates a user uploading a CSV file and checks for the success message and progress bar.

```tsx
it('uploads a CSV file and shows success message', async () => {
  (uploadFileInChunks as jest.Mock).mockImplementationOnce(async (_file, _name, setProgress, setMessage, fetchData) => {
    setProgress(100);
    setMessage('CSV uploaded successfully!');
    if (fetchData) fetchData();
    return Promise.resolve();
  });
  render(<Home />);
  fireEvent.click(screen.getByTestId('csv-upload-button'));
  const input = document.getElementById('csv-upload') as HTMLInputElement;
  const file = new File(['id,timestamp\n1,2023-01-01'], 'test.csv', { type: 'text/csv' });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => {
    expect(screen.getByText(/CSV uploaded successfully!/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Progress: 100%/i)).toBeInTheDocument();
  });
  expect(uploadFileInChunks).toHaveBeenCalled();
});
```
*Purpose:* Ensures the upload logic and UI feedback work as expected for a successful upload.

#### 2. Filtering Data by Date
Simulates a user setting date filters and clicking Apply, then checks that only the filtered data is shown.

```tsx
it('filters data by initial and final timestamp with multiple data points', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      count: 2,
      results: [
        { id: 1, timestamp: '2024-06-01T12:00:00Z', odometer: 1000, soc: 80, elevation: 10 },
        { id: 2, timestamp: '2024-06-01T18:00:00Z', odometer: 2000, soc: 85, elevation: 20 },
      ],
      vehicleIDs: ['vehicle-1'],
    },
  });
  render(<Home />);
  const initialInput = screen.getByLabelText(/Initial Timestamp/i);
  const finalInput = screen.getByLabelText(/Final Timestamp/i);
  fireEvent.change(initialInput, { target: { value: '2024-06-01T00:00' } });
  fireEvent.change(finalInput, { target: { value: '2024-06-01T23:59' } });
  fireEvent.click(screen.getByText('Apply'));
  await waitFor(() => {
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });
});
```
*Purpose:* Verifies that the filter UI triggers the correct API call and only the filtered data is rendered.

#### 3. Error Handling on Upload
Simulates a backend error during CSV upload and checks that an error message is shown to the user.

```tsx
it('handles upload error', async () => {
  (uploadFileInChunks as jest.Mock).mockImplementationOnce(async () => {
    throw new Error('Backend is offline or unreachable.');
  });
  render(<Home />);
  fireEvent.click(screen.getByTestId('csv-upload-button'));
  const input = document.getElementById('csv-upload') as HTMLInputElement;
  const file = new File(['id,timestamp\n1,2023-01-01'], 'test.csv', { type: 'text/csv' });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => {
    expect(screen.getByText(/Failed to upload CSV/i)).toBeInTheDocument();
  });
});
```
*Purpose:* Ensures the UI provides clear feedback when an upload fails.

#### 4. Sorting Data by Column
Simulates a user clicking a table header to sort data and checks that the correct API call is made and sorted data is displayed.

```tsx
it('sorts data by odometer when column header is clicked', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      count: 2,
      results: [
        { id: 1, timestamp: '2024-06-01T12:00:00Z', odometer: 2000, soc: 80, elevation: 10 },
        { id: 2, timestamp: '2024-06-01T18:00:00Z', odometer: 1000, soc: 85, elevation: 20 },
      ],
      vehicleIDs: ['vehicle-1'],
    },
  });
  render(<Home />);
  fireEvent.click(screen.getByText('Odometer'));
  await waitFor(() => {
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });
});
```
*Purpose:* Ensures that sorting triggers the correct API call and the UI displays sorted data.

#### 5. Pagination
Simulates a user changing pages using the page input field and checks that the correct data is displayed for each page. This approach matches the UI logic, which triggers a new API call when the page input is changed and blurred.

```tsx
it('changes page and displays correct data', async () => {
  // First page
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      count: 3,
      results: [
        { id: 1, timestamp: '2024-06-01T12:00:00Z', odometer: 1000, soc: 80, elevation: 10 },
        { id: 2, timestamp: '2024-06-01T18:00:00Z', odometer: 2000, soc: 85, elevation: 20 },
      ],
      vehicleIDs: ['vehicle-1'],
    },
  });
  render(<Home />);
  await waitFor(() => {
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });
  // Set up the mock for the second page BEFORE changing the page
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      count: 3,
      results: [
        { id: 3, timestamp: '2024-06-02T12:00:00Z', odometer: 3000, soc: 90, elevation: 30 },
      ],
      vehicleIDs: ['vehicle-1'],
    },
  });
  const pageInput = screen.getByRole('spinbutton');
  fireEvent.change(pageInput, { target: { value: '2' } });
  fireEvent.blur(pageInput);
  expect(await screen.findByText('3000')).toBeInTheDocument();
});
```
*Purpose:* Ensures that pagination controls (specifically the page input) trigger the correct API calls and the UI displays the correct data for each page. This method is robust and matches the actual user interaction flow in the app.

---