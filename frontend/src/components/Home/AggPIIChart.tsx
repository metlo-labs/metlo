import React from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"
import {
  HStack,
  StackProps,
  Grid,
  GridItem,
  Text,
  VStack,
  Box,
  Heading,
  StackDivider,
} from "@chakra-ui/react"
import { DataClass } from "@common/enums"

ChartJS.register(ArcElement, Tooltip, Legend)

interface AggPIIChartProps extends StackProps {
  piiDataTypeCount: Map<DataClass, number>
}

const AggPIIChart: React.FC<AggPIIChartProps> = React.memo(
  ({ piiDataTypeCount, ...props }) => {
    const data = Object.values(piiDataTypeCount)
    const labels = Object.keys(piiDataTypeCount)
    const totalFields = data.reduce((curr, a) => curr + a, 0)
    const backgroundColor = [
      "rgba(255, 99, 132, 0.8)",
      "rgba(54, 162, 235, 0.8)",
      "rgba(255, 206, 86, 0.8)",
      "rgba(75, 192, 192, 0.8)",
      "rgba(153, 102, 255, 0.8)",
      "rgba(255, 159, 64, 0.8)",
    ]
    const borderColor = [
      "rgba(255, 99, 132, 1)",
      "rgba(54, 162, 235, 1)",
      "rgba(255, 206, 86, 1)",
      "rgba(75, 192, 192, 1)",
      "rgba(153, 102, 255, 1)",
      "rgba(255, 159, 64, 1)",
    ]
    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor,
          borderWidth: 1,
        },
      ],
    }
    const options = {
      responsive: true,
      cutout: "60%",
      plugins: {
        legend: {
          display: false,
        },
      },
    } as ChartOptions
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
          Sensitive Data
        </Heading>
        <HStack w="full" pt="2" px="4" alignItems="flex-start" spacing="8">
          <Box w="30%">
            <Doughnut options={options} data={chartData} />
          </Box>
          <VStack w="70%" alignItems="flex-start" spacing="4">
            <Text fontWeight="semibold">{`${totalFields} Total PII Fields`}</Text>
            <Grid templateColumns="repeat(2, 1fr)" gap="4">
              {labels.map((e, i) => (
                <GridItem key={i}>
                  <HStack>
                    <Box bg={backgroundColor[i]} px="2" py="1" />
                    <Text fontSize="sm">{e}</Text>
                  </HStack>
                </GridItem>
              ))}
            </Grid>
            <Text pt="4">View Sensitive Data Dashboard →</Text>
          </VStack>
        </HStack>
      </VStack>
    )
  },
)

export default AggPIIChart
