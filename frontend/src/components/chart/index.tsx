import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#ffffff", // white legend text
      },
    },
    tooltip: {
      backgroundColor: "#1f2937", // dark tooltip bg
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#ffffff", // white x axis text
      },
      grid: {
        color: "#374151", // dark gray grid lines
      },
    },
    y: {
      ticks: {
        color: "#ffffff", // white y axis text
      },
      grid: {
        color: "#374151", // dark gray grid lines
      },
    },
  },
};

const LineChart = ({ socChartData }: { socChartData: ChartData }) => {
  return (
    <div className="bg-neutral-900 rounded shadow p-4 w-full h-96">
      <Line data={socChartData} options={options} />
    </div>
  );
};

export default LineChart;
