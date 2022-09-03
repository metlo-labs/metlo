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
  StackDivider,
} from "@chakra-ui/react"
import { DataClass } from "@common/enums"

ChartJS.register(ArcElement, Tooltip, Legend)

interface AggPIIChartProps extends StackProps {
  piiDataTypeCount: Map<DataClass, number>
  totalPIIFields: number
  totalEndpoints: number
}

const AggPIIChart: React.FC<AggPIIChartProps> = React.memo(
  ({ totalPIIFields, totalEndpoints, piiDataTypeCount, ...props }) => {
    const data = Object.values(piiDataTypeCount)
    const labels = Object.keys(piiDataTypeCount)
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
      <HStack
        overflow="hidden"
        alignItems="flex-start"
        bg="cellBG"
        spacing="0"
        divider={<StackDivider />}
        w="full"
        h="60"
      >
        <VStack divider={<StackDivider />} spacing="0" h="full">
          <VStack
            bg="cellBG"
            py="4"
            spacing="1"
            px="20"
            h="50%"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="semibold" rounded="md">
              {totalPIIFields}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              PII Fields
            </Text>
          </VStack>
          <VStack
            bg="cellBG"
            py="4"
            spacing="1"
            h="50%"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="semibold" rounded="md">
              {totalEndpoints}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              Endpoints
            </Text>
          </VStack>
        </VStack>
        <HStack spacing="12" flexGrow="1" alignItems="center" p="4" h="full">
          <Box w="44">
            <Doughnut options={options} data={chartData} />
          </Box>
          <VStack
            flexGrow="1"
            alignItems="flex-start"
            spacing="4"
            h="full"
            py="8"
          >
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
          </VStack>
        </HStack>
      </HStack>
    )
  },
)

export default AggPIIChart
