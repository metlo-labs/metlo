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
import { PIE_BACKGROUND_COLORS, PIE_BORDER_COLORS } from "~/constants"

ChartJS.register(ArcElement, Tooltip, Legend)

interface AggPIIChartProps extends StackProps {
  piiDataTypeCount: Map<DataClass, number>
}

const AggPIIChart: React.FC<AggPIIChartProps> = React.memo(
  ({ piiDataTypeCount, ...props }) => {
    const data = Object.values(piiDataTypeCount)
    const labels = Object.keys(piiDataTypeCount)
    const totalFields = data.reduce((curr, a) => curr + a, 0)
    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: PIE_BACKGROUND_COLORS,
          borderColor: PIE_BORDER_COLORS,
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
                    <Box bg={PIE_BACKGROUND_COLORS[i]} px="2" py="1" />
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
