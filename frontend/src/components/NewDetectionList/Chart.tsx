import React from "react"
import { Box } from "@chakra-ui/react"
import { Bar } from "react-chartjs-2"
import {
  Chart,
  TimeSeriesScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import "chartjs-adapter-date-fns"
import {
  GetNewDetectionsParams,
  NewDetectionsAggRes,
} from "@common/api/endpoint"
import moment from "moment"

Chart.register(Tooltip, Legend, LinearScale, BarElement, TimeSeriesScale)

export const formatter = Intl.NumberFormat("en", { notation: "compact" })

const ENDPOINT_BAR_COLOR = "#22c55e"
const DATA_FIELD_BAR_COLOR = "#2563eb"

interface AggChartProps {
  data: NewDetectionsAggRes[]
  params: GetNewDetectionsParams
  setParams: (newParams: GetNewDetectionsParams) => void
}

export const NewDetectionAggChart: React.FC<AggChartProps> = React.memo(
  ({ data, params, setParams }) => {
    const labels = data?.map(e => e.day) ?? []
    const barData = {
      labels,
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

    const options = {
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
      onClick: (evt, element) => {
        const labelIdx = element?.[0]?.index
        if (
          labelIdx === null ||
          labelIdx === undefined ||
          typeof labelIdx !== "number"
        ) {
          return
        }
        const label = labels[labelIdx]
        if (!label) {
          return
        }
        const currEnd = moment(params.end)
        const newStart = moment(label)
        if (newStart > currEnd) {
          setParams({
            start: newStart.startOf("day").toISOString(),
            end: moment().local().endOf("day").toISOString(),
          })
        } else {
          setParams({
            start: newStart.startOf("day").toISOString(),
          })
        }
      },
    }

    return (
      <Box w="full" h="60">
        <Bar options={options as any} data={barData} />
      </Box>
    )
  },
)
