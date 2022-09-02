import React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  TimeSeriesScale,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import {
  Box,
  HStack,
  Heading,
  StackDivider,
  StackProps,
  VStack,
  Text,
} from "@chakra-ui/react"
import "chartjs-adapter-date-fns"
import { UsageStats } from "@common/types"

ChartJS.register(CategoryScale, TimeSeriesScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface UsageChartProps extends StackProps {
  usageData: UsageStats
}

const UsageChart: React.FC<UsageChartProps> = React.memo(
  ({ usageData, ...props }) => {
    const options = {
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
    const labels = usageData.dailyUsage.map(e => e.day)
    const values = usageData.dailyUsage.map(e => e.cnt)

    const data = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
      ],
    }
    return (
      <VStack
        borderWidth="1px"
        rounded="md"
        overflow="hidden"
        py="4"
        alignItems="flex-start"
        spacing="2"
        bg="cellBG"
        divider={<StackDivider />}
        {...props}
      >
        <Heading px="4" size="md" color="gray.800">
          API Activity
        </Heading>
        <HStack px="4" w="full" alignItems="flex-start" spacing="8">
          <Box w="70%">
            <Bar options={options as any} data={data} />
          </Box>
          <VStack alignItems="flex-start">
            <Text>{usageData.last1MinCnt || 0} Calls Per Minute</Text>
            <Text>{usageData.last60MinCnt || 0} Calls Last Hour</Text>
          </VStack>
        </HStack>
      </VStack>
    )
  },
)

export default UsageChart
