import React from "react"
import {
  Chart,
  TimeSeriesScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import "chartjs-adapter-date-fns"
import { NewDetectionsAggRes } from "@common/api/endpoint"
import { Box } from "@chakra-ui/react"
import { Bar } from "react-chartjs-2"

Chart.register(Tooltip, Legend, LinearScale, BarElement, TimeSeriesScale)

export const formatter = Intl.NumberFormat("en", { notation: "compact" })

const ENDPOINT_BAR_COLOR = "#22c55e"
const DATA_FIELD_BAR_COLOR = "#2563eb"

const BAR_OPTIONS = {
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "bottom",
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
      },
      time: {
        unit: "day",
        tooltipFormat: "yyyy-MM-dd",
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
        callback: label => {
          return formatter.format(label)
        },
      },
    },
  },
}

interface AggChartProps {
  data: NewDetectionsAggRes[]
}

export const NewDetectionAggChart: React.FC<AggChartProps> = React.memo(
  ({ data }) => {
    const barData = {
      labels: data?.map(e => e.day) ?? [],
      datasets: [
        {
          label: "Endpoints",
          data: data?.map(e => e.numEndpoints) ?? [],
          backgroundColor: ENDPOINT_BAR_COLOR,
          barThickness: 24,
          borderRadius: 4,
        },
        {
          label: "Data Fields",
          data: data?.map(e => e.numFields) ?? [],
          backgroundColor: DATA_FIELD_BAR_COLOR,
          barThickness: 24,
          borderRadius: 4,
        },
      ],
    }

    return (
      <Box w="full" h="60">
        <Bar options={BAR_OPTIONS as any} data={barData} />
      </Box>
    )
  },
)
