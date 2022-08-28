import React from "react"
import { useMediaQuery } from "@chakra-ui/react"
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  TimeSeriesScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"
import "chartjs-adapter-date-fns"
import { Usage } from "@common/types"

ChartJS.register(
  LinearScale,
  TimeSeriesScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

interface EndpointUsageChartProps {
  usage: Usage[]
}

const EndpointUsageChart: React.FC<EndpointUsageChartProps> = React.memo(
  ({ usage }) => {
    const [isLargerThan440] = useMediaQuery("(min-width: 440px)")
    let options = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          type: "timeseries",
          grid: {
            display: false,
          },
          ticks: {
            source: "labels",
            autoSkip: true,
            maxTicksLimit: isLargerThan440 ? 13 : 4
          },
          time: {
            unit: "day",
            tooltipFormat: "yyyy-MM-dd h:mm a",
            displayFormats: {
              millisecond: "h:mm a",
              second: "h:mm a",
              minute: "h a",
              hour: "h a",
            },
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            precision: 0,
          },
        },
      },
    }
    let labels = []
    let datasets = [
      {
        data: [],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ]
    labels = usage.map(item => item.date)
    datasets[0].data = usage.map(item => item.count)
    const data = {
      labels,
      datasets,
    }
    return <Line height="100" options={options as any} data={data} />
  },
)

export default EndpointUsageChart
