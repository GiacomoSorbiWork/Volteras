import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@/components/chart', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'chart' }),
  };
});
jest.mock('@/components/buttons', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('button', props, props.children),
  };
});

// Mock uploadFileInChunks
jest.mock('@/utils', () => ({
  uploadFileInChunks: jest.fn(),
}));
import { uploadFileInChunks } from '@/utils';

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main title', () => {
    render(<Home />);
    expect(screen.getByText(/Vehicle Dashboard/i)).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<Home />);
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Odometer')).toBeInTheDocument();
    expect(screen.getByText('SOC')).toBeInTheDocument();
    expect(screen.getByText('Elevation')).toBeInTheDocument();
  });

  it('renders file upload button', () => {
    render(<Home />);
    expect(screen.getByTestId('csv-upload-button')).toBeInTheDocument();
  });

 

  it('renders chart', () => {
    render(<Home />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('fetches and displays data', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        count: 1,
        results: [
          {
            id: 1,
            timestamp: new Date().toISOString(),
            odometer: 1000,
            soc: 80,
            elevation: 10,
          },
        ],
        vehicleIDs: ['vehicle-1'],
      },
    });
    render(<Home />);
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
    expect(screen.getByText(/SOC/)).toBeInTheDocument();
  });

  it('shows upload progress bar when uploading', async () => {
    (uploadFileInChunks as jest.Mock).mockImplementationOnce(async (_file, _name, setProgress, setMessage) => {
      setProgress(50);
      setMessage('Uploading...');
      return Promise.resolve();
    });
    render(<Home />);
    fireEvent.click(screen.getByTestId('csv-upload-button'));
    const input = document.getElementById('csv-upload') as HTMLInputElement;
    const file = new File(['id,timestamp\n1,2023-01-01'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
      expect(screen.getByText(/Upload Progress: 50%/i)).toBeInTheDocument();
    });
  });

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

  it('can change vehicle selection', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        count: 1,
        results: [],
        vehicleIDs: ['vehicle-1', 'vehicle-2'],
      },
    });
    render(<Home />);
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
    const select = screen.getByDisplayValue('All Vehicles');
    fireEvent.change(select, { target: { value: 'vehicle-2' } });
    expect(select).toHaveValue('vehicle-2');
  });

  it('can change page size', () => {
    render(<Home />);
    const select = screen.getByLabelText(/Rows per page/i);
    fireEvent.change(select, { target: { value: '20' } });
    expect(select).toHaveValue('20');
  });
});

describe('CSV Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
});

describe('Filter Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters data by initial and final timestamp with multiple data points', async () => {
    // Mock axios.get to return only the filtered data points
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        count: 2,
        results: [
          {
            id: 1,
            timestamp: '2024-06-01T12:00:00Z',
            odometer: 1000,
            soc: 80,
            elevation: 10,
          },
          {
            id: 2,
            timestamp: '2024-06-01T18:00:00Z',
            odometer: 2000,
            soc: 85,
            elevation: 20,
          },
        ],
        vehicleIDs: ['vehicle-1'],
      },
    });
    render(<Home />);
    // Set initial and final timestamp to filter for June 1st only
    const initialInput = screen.getByLabelText(/Initial Timestamp/i);
    const finalInput = screen.getByLabelText(/Final Timestamp/i);
    fireEvent.change(initialInput, { target: { value: '2024-06-01T00:00' } });
    fireEvent.change(finalInput, { target: { value: '2024-06-01T23:59' } });
    // Click Apply
    fireEvent.click(screen.getByText('Apply'));
    // Wait for filtered data to appear
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
      // Only the filtered data points should be visible
      expect(screen.getByText('80')).toBeInTheDocument(); // SOC value for id 1
      expect(screen.getByText('1000')).toBeInTheDocument(); // Odometer for id 1
      expect(screen.getByText('85')).toBeInTheDocument(); // SOC value for id 2
      expect(screen.getByText('2000')).toBeInTheDocument(); // Odometer for id 2
    });
  });
});

describe('Sorting Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    // Click the Odometer column header to sort
    fireEvent.click(screen.getByText('Odometer'));
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
      // Both odometer values should be present
      expect(screen.getByText('2000')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });
});

describe('Pagination Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('changes page size and displays correct number of rows', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        count: 5,
        results: [
          { id: 1, timestamp: '2024-06-01T12:00:00Z', odometer: 1000, soc: 80, elevation: 10 },
          { id: 2, timestamp: '2024-06-01T18:00:00Z', odometer: 2000, soc: 85, elevation: 20 },
          { id: 3, timestamp: '2024-06-02T12:00:00Z', odometer: 3000, soc: 90, elevation: 30 },
          { id: 4, timestamp: '2024-06-03T12:00:00Z', odometer: 4000, soc: 95, elevation: 40 },
          { id: 5, timestamp: '2024-06-04T12:00:00Z', odometer: 5000, soc: 99, elevation: 50 },
        ],
        vehicleIDs: ['vehicle-1'],
      },
    });
    render(<Home />);
    // Change page size to 5
    fireEvent.change(screen.getByLabelText(/Rows per page/i), { target: { value: '5' } });
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
    });
  });
});
